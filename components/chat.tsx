"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn, fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { getChatRouteKey } from "@/lib/voice";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./chat-history-data";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

const CHAT_THEME_STORAGE_KEY = "brooks-ai-hub-chat-theme";
const CHAT_THEME_AUDIO_STORAGE_KEY = "brooks-ai-hub-chat-theme-audio";
const THEME_AUDIO_RESUME_EVENT = "brooks-ai-hub:resume-theme-audio";
const THEME_AUDIO_VOLUME = 0.35;
const CHAT_THEMES = [
  {
    id: "forest",
    label: "Forest Beats",
    audioTitle: "Forest Beats",
    audioSrc: "/audio/forest-beats-1.mp3",
    background: "/backgrounds/brooksaihub-landingpage-background.png",
    badge: "free",
  },
  {
    id: "space",
    label: "8-bit Space Tunes",
    audioTitle: "8-bit Space Tunes",
    audioSrc: "/audio/8bitspace-01-audio.mp3",
    background: "/backgrounds/8bitspace-background.png",
    badge: "free",
  },
  {
    id: "bens-garden",
    label: "Benjamin Bear's Garden",
    audioTitle: "Benjamin Bear's Garden",
    audioSrc: "/audio/bens-garden-song.mp3",
    background: "/backgrounds/bens-garden-backgrounds.png",
    badge: "free",
  },
  {
    id: "my-daughter-death-1",
    label: "My Daughter, Death 1",
    audioTitle: "My Daughter, Death 1",
    audioSrc: "/audio/mdd-cuts-song.mp3",
    background: "/backgrounds/mdd-backgrounds-02.png",
    badge: "free",
  },
  {
    id: "ghost-girl-1",
    label: "The Ghost Girl 1",
    audioTitle: "The Ghost Girl 1",
    audioSrc: "/audio/the-ghost-girl-song.mp3",
    background: "/backgrounds/the-ghost-girl-app-theme.png",
    badge: "free",
  },
] as const;

type ChatThemeId = (typeof CHAT_THEMES)[number]["id"];
type ChatThemeOption = Pick<
  (typeof CHAT_THEMES)[number],
  "id" | "label" | "badge"
>;

const CHAT_THEME_OPTIONS: ChatThemeOption[] = CHAT_THEMES.map(
  ({ id, label, badge }) => ({
    id,
    label,
    badge,
  })
);
const DEFAULT_CHAT_THEME: ChatThemeId = "forest";
const isChatTheme = (value: string): value is ChatThemeId =>
  CHAT_THEMES.some((theme) => theme.id === value);

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  initialChatTitle,
  initialRouteKey,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  initialChatTitle: string;
  initialRouteKey?: string | null;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const chatLayoutStyle = {
    "--chat-composer-offset": "calc(8.5rem + env(safe-area-inset-bottom, 0px))",
  } as CSSProperties;

  const router = useRouter();
  const pathname = usePathname();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const chatRouteKey = getChatRouteKey({
    routeKey: initialRouteKey,
    title: initialChatTitle,
  });

  const { mutate } = useSWRConfig();

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // When user navigates back/forward, refresh to sync with URL
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const [chatTheme, setChatTheme] = useState<ChatThemeId>(DEFAULT_CHAT_THEME);
  const [isThemeAudioEnabled, setIsThemeAudioEnabled] = useState(true);
  const currentModelIdRef = useRef(currentModelId);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<{ src: string; buffer: AudioBuffer } | null>(
    null
  );

  const isBrooksAiHubThemeRoute =
    chatRouteKey === "brooks-ai-hub" ||
    chatRouteKey === "default" ||
    chatRouteKey.startsWith("brooks-ai-hub");
  const isBrooksAiHubPath = Boolean(pathname?.startsWith("/brooks-ai-hub"));
  const isChatRoute = Boolean(pathname?.startsWith("/chat/"));
  const isChatThemeEnabled =
    isChatRoute || isBrooksAiHubPath || isBrooksAiHubThemeRoute;
  const activeTheme =
    CHAT_THEMES.find((theme) => theme.id === chatTheme) ?? CHAT_THEMES[0];

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  useEffect(() => {
    if (!isChatThemeEnabled) {
      return;
    }

    const storedTheme = window.localStorage.getItem(CHAT_THEME_STORAGE_KEY);
    if (storedTheme && isChatTheme(storedTheme)) {
      setChatTheme(storedTheme);
    }
  }, [isChatThemeEnabled]);

  useEffect(() => {
    if (!isChatThemeEnabled) {
      return;
    }

    window.localStorage.setItem(CHAT_THEME_STORAGE_KEY, chatTheme);
  }, [chatTheme, isChatThemeEnabled]);

  useEffect(() => {
    if (!isChatThemeEnabled) {
      return;
    }

    const storedPreference = window.localStorage.getItem(
      CHAT_THEME_AUDIO_STORAGE_KEY
    );
    if (storedPreference === "off") {
      setIsThemeAudioEnabled(false);
    }
    if (storedPreference === "on") {
      setIsThemeAudioEnabled(true);
    }
  }, [isChatThemeEnabled]);

  useEffect(() => {
    if (!isChatThemeEnabled) {
      return;
    }

    window.localStorage.setItem(
      CHAT_THEME_AUDIO_STORAGE_KEY,
      isThemeAudioEnabled ? "on" : "off"
    );
  }, [isThemeAudioEnabled, isChatThemeEnabled]);

  useEffect(() => {
    if (!isChatThemeEnabled) {
      return;
    }

    let isCancelled = false;

    const stopWebAudio = () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch {
          // Ignore: source may already be stopped.
        }
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      if (audioGainRef.current) {
        audioGainRef.current.disconnect();
        audioGainRef.current = null;
      }
    };

    const stopHtmlAudio = () => {
      const audioElement = audioElementRef.current;
      if (!audioElement) {
        return;
      }
      audioElement.pause();
      audioElement.currentTime = 0;
    };

    const stopThemeAudio = () => {
      stopWebAudio();
      stopHtmlAudio();
    };

    const getAudioContextConstructor = () => {
      if (typeof window === "undefined") {
        return null;
      }
      if (window.AudioContext) {
        return window.AudioContext;
      }
      const webkitContext = (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
      return webkitContext ?? null;
    };

    const getAudioBuffer = async (
      context: AudioContext
    ): Promise<AudioBuffer | null> => {
      if (audioBufferRef.current?.src === activeTheme.audioSrc) {
        return audioBufferRef.current.buffer;
      }

      try {
        const response = await fetch(activeTheme.audioSrc);
        if (!response.ok) {
          return null;
        }
        const data = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(data.slice(0));
        audioBufferRef.current = { src: activeTheme.audioSrc, buffer };
        return buffer;
      } catch {
        return null;
      }
    };

    const startWebAudio = async (): Promise<boolean> => {
      const AudioContextConstructor = getAudioContextConstructor();
      if (!AudioContextConstructor) {
        return false;
      }

      const context =
        audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;

      const buffer = await getAudioBuffer(context);
      if (!buffer) {
        return false;
      }

      if (isCancelled) {
        return true;
      }

      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = 0;
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain).connect(context.destination);
      source.start(0);
      audioSourceRef.current = source;
      audioGainRef.current = gain;

      try {
        await context.resume();
      } catch {
        // Ignore: autoplay policies may block background audio.
      }

      return true;
    };

    const startHtmlAudio = async () => {
      const audioElement = audioElementRef.current;
      if (!audioElement) {
        return;
      }
      audioElement.muted = true;
      audioElement.volume = THEME_AUDIO_VOLUME;
      audioElement.src = activeTheme.audioSrc;
      try {
        await audioElement.play();
      } catch {
        // Ignore: autoplay policies may block background audio.
      }
    };

    const resumeThemeAudio = async () => {
      if (!isThemeAudioEnabled) {
        return;
      }

      const context = audioContextRef.current;
      const gain = audioGainRef.current;
      if (context && gain) {
        gain.gain.value = THEME_AUDIO_VOLUME;
        try {
          await context.resume();
        } catch {
          // Ignore: user settings or browser policies may block playback.
        }
        return;
      }

      const audioElement = audioElementRef.current;
      if (!audioElement) {
        return;
      }
      audioElement.muted = false;
      audioElement.volume = THEME_AUDIO_VOLUME;
      try {
        await audioElement.play();
      } catch {
        // Ignore: user settings or browser policies may block playback.
      }
    };

    const startThemeAudio = async () => {
      stopThemeAudio();
      if (!isThemeAudioEnabled) {
        return;
      }

      const started = await startWebAudio();
      if (!started) {
        await startHtmlAudio();
      }
    };

    void startThemeAudio();

    if (isThemeAudioEnabled) {
      window.addEventListener("pointerdown", resumeThemeAudio, { once: true });
      window.addEventListener("keydown", resumeThemeAudio, { once: true });
      window.addEventListener(THEME_AUDIO_RESUME_EVENT, resumeThemeAudio);
    }

    return () => {
      window.removeEventListener("pointerdown", resumeThemeAudio);
      window.removeEventListener("keydown", resumeThemeAudio);
      window.removeEventListener(THEME_AUDIO_RESUME_EVENT, resumeThemeAudio);
      stopThemeAudio();
      if (audioContextRef.current?.state === "running") {
        audioContextRef.current.suspend().catch(() => {
          // Ignore: audio context might already be closed.
        });
      }
    };
  }, [activeTheme.audioSrc, isChatThemeEnabled, isThemeAudioEnabled]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      const shouldContinue =
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false;
      return shouldContinue;
    },
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...(activeAtoId ? { atoId: activeAtoId } : null),
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const searchAtoId = searchParams.get("atoId");
  const [activeAtoId, setActiveAtoId] = useState<string | null>(searchAtoId);

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    setActiveAtoId(searchAtoId);
  }, [searchAtoId]);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      const params = new URLSearchParams();
      if (activeAtoId) {
        params.set("atoId", activeAtoId);
      }
      const nextUrl = params.toString()
        ? `/chat/${id}?${params.toString()}`
        : `/chat/${id}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [query, sendMessage, hasAppendedQuery, id, activeAtoId]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleThemeChange = useCallback((value: string) => {
    if (isChatTheme(value)) {
      setChatTheme(value);
    }
  }, []);

  const handleThemeAudioToggle = useCallback(() => {
    setIsThemeAudioEnabled((previous) => !previous);
  }, []);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const updateAtoIdInUrl = useCallback(
    (nextAtoId: string | null) => {
      if (typeof window === "undefined") {
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (nextAtoId) {
        params.set("atoId", nextAtoId);
      } else {
        params.delete("atoId");
      }
      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState({}, "", nextUrl);
    },
    [pathname]
  );

  const handleSuggestedFolderSelect = useCallback(
    (folder: string, options?: { atoId?: string }) => {
      const normalizedFolder = folder.endsWith("/") ? folder : `${folder}/`;
      setInput(`${normalizedFolder} `);
      const nextAtoId = options?.atoId ?? null;
      setActiveAtoId(nextAtoId);
      updateAtoIdInUrl(nextAtoId);

      requestAnimationFrame(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          '[data-testid="multimodal-input"]'
        );
        if (!textarea) {
          return;
        }

        textarea.focus();
        const endPosition = textarea.value.length;
        textarea.setSelectionRange(endPosition, endPosition);
      });
    },
    [setActiveAtoId, setInput, updateAtoIdInUrl]
  );

  const handleAtoSelection = useCallback(
    (nextAtoId: string | null) => {
      setActiveAtoId(nextAtoId);
      updateAtoIdInUrl(nextAtoId);
    },
    [setActiveAtoId, updateAtoIdInUrl]
  );

  return (
    <>
      <div
        className={cn(
          "overscroll-behavior-contain relative flex h-dvh min-w-0 touch-pan-y flex-col bg-background",
          isChatThemeEnabled ? "chat-theme" : null
        )}
        data-chat-theme={isChatThemeEnabled ? chatTheme : undefined}
      >
        {isChatThemeEnabled && (
          <>
            <div aria-hidden className="chat-theme-bg" />
            <div aria-hidden className="chat-theme-overlay" />
            <audio
              key={activeTheme.id}
              ref={audioElementRef}
              src={activeTheme.audioSrc}
              title={activeTheme.audioTitle}
              loop
              preload="auto"
              playsInline
            />
          </>
        )}
        <div className="relative z-10 flex h-dvh min-w-0 flex-col" style={chatLayoutStyle}>
          <ChatHeader
            chatId={id}
            isReadonly={isReadonly}
            isThemeAudioEnabled={isChatThemeEnabled ? isThemeAudioEnabled : undefined}
            onThemeChange={isChatThemeEnabled ? handleThemeChange : undefined}
            onThemeAudioToggle={
              isChatThemeEnabled ? handleThemeAudioToggle : undefined
            }
            routeKey={chatRouteKey}
            selectedThemeId={isChatThemeEnabled ? chatTheme : undefined}
            selectedVisibilityType={initialVisibilityType}
            themeOptions={isChatThemeEnabled ? CHAT_THEME_OPTIONS : undefined}
            showSpotifyTopBar={messages.length > 0}
          />

          <Messages
            addToolApprovalResponse={addToolApprovalResponse}
            chatId={id}
            chatRouteKey={chatRouteKey}
            chatTitle={initialChatTitle}
            isArtifactVisible={isArtifactVisible}
            isReadonly={isReadonly}
            messages={messages}
            onSelectSuggestedFolder={handleSuggestedFolderSelect}
            regenerate={regenerate}
            selectedModelId={initialChatModel}
            setMessages={setMessages}
            status={status}
            votes={votes}
          />

          <div className="sticky bottom-0 z-20 mx-auto flex w-full max-w-4xl gap-2 border-t border-border/60 bg-background/85 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md supports-[backdrop-filter]:bg-background/70 md:px-4 md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {!isReadonly && (
              <MultimodalInput
                atoId={activeAtoId}
                attachments={attachments}
                chatId={id}
                chatRouteKey={initialRouteKey}
                input={input}
                messages={messages}
                onModelChange={setCurrentModelId}
                onSelectAto={handleAtoSelection}
                selectedModelId={currentModelId}
                selectedVisibilityType={visibilityType}
                sendMessage={sendMessage}
                setAttachments={setAttachments}
                setInput={setInput}
                setMessages={setMessages}
                status={status}
                stop={stop}
              />
            )}
          </div>
        </div>
      </div>

      <Artifact
        addToolApprovalResponse={addToolApprovalResponse}
        attachments={attachments}
        chatId={id}
        chatRouteKey={chatRouteKey}
        chatTitle={initialChatTitle}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate AI Gateway billing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "/settings";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
