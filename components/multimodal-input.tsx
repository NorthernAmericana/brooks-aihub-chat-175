"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useProfileIcon } from "@/hooks/use-profile-icon";
import {
  getAgentConfigById,
  getAgentConfigBySlash,
} from "@/lib/ai/agents/registry";
import { NAMC_TRAILERS } from "@/lib/namc-trailers";
import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  modelsByProvider,
} from "@/lib/ai/models";
import {
  parseSlashAction,
  rememberSlashAction,
} from "@/lib/suggested-actions";
import type { Attachment, ChatMessage } from "@/lib/types";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants";
import { cn, fetcher } from "@/lib/utils";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./elements/prompt-input";
import { ArrowUpIcon, MicIcon, PaperclipIcon, StopIcon } from "./icons";
import { ChatProfilePanel } from "./chat-profile-panel";
import { ChatSwipeMenu } from "./chat-swipe-menu";
import { PreviewAttachment } from "./preview-attachment";
import { RouteChangeModal } from "./route-change-modal";
import { SlashSuggestions } from "./slash-suggestions";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { VisibilityType } from "./visibility-selector";

const TRAILER_PROMPT_REGEX = /^(?:let's|lets)\s+watch\s+trailers\b/i;

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function PureMultimodalInput({
  chatId,
  chatRouteKey,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  atoId,
  onSelectAto,
}: {
  chatId: string;
  chatRouteKey?: string | null;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  atoId?: string | null;
  onSelectAto?: (atoId: string | null) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { width } = useWindowSize();
  const { data: session } = useSession();
  const { profileIcon } = useProfileIcon();
  const { entitlements } = useEntitlements(session?.user?.id);
  const avatarSrc = profileIcon ?? session?.user?.image ?? DEFAULT_AVATAR_SRC;

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const slashPrefixMatch = input.match(/^\/[^/]+\//);
  const slashPrefix = slashPrefixMatch?.[0] ?? "";
  const slashRemainder = slashPrefix ? input.slice(slashPrefix.length) : input;

  useEffect(() => {
    if (!slashPrefix) {
      setSlashPrefixIndent(0);
      return;
    }

    const bubble = slashPrefixRef.current;
    const textarea = textareaRef.current;
    if (!bubble || !textarea) {
      return;
    }

    const measurePrefixTextWidth = () => {
      const computed = window.getComputedStyle(textarea);
      const font = [
        computed.fontStyle,
        computed.fontVariant,
        computed.fontWeight,
        computed.fontSize,
        computed.lineHeight,
        computed.fontFamily,
      ]
        .filter(Boolean)
        .join(" ");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        return 0;
      }
      context.font = font;
      const baseWidth = context.measureText(slashPrefix).width;
      const letterSpacing = Number.parseFloat(computed.letterSpacing || "0");
      if (Number.isNaN(letterSpacing) || slashPrefix.length <= 1) {
        return baseWidth;
      }
      return baseWidth + letterSpacing * (slashPrefix.length - 1);
    };

    const updateIndent = () => {
      const bubbleWidth = bubble.getBoundingClientRect().width;
      const prefixTextWidth = measurePrefixTextWidth();
      const indent = Math.max(0, bubbleWidth - prefixTextWidth);
      setSlashPrefixIndent(indent);
    };

    updateIndent();

    const resizeObserver = new ResizeObserver(updateIndent);
    resizeObserver.observe(bubble);

    return () => {
      resizeObserver.disconnect();
    };
  }, [slashPrefix]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [_recordedText, setRecordedText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const slashPrefixRef = useRef<HTMLSpanElement>(null);
  const [slashPrefixIndent, setSlashPrefixIndent] = useState(0);
  const [activeMenu, setActiveMenu] = useState<"history" | "profile" | null>(
    "history"
  );
  const [isTrailerMenuOpen, setIsTrailerMenuOpen] = useState(false);
  const [routeChangeModal, setRouteChangeModal] = useState<{
    open: boolean;
    currentRoute: string;
    newRoute: string;
    draftMessage: string;
  }>({
    open: false,
    currentRoute: "",
    newRoute: "",
    draftMessage: "",
  });
  const { data: atoData } = useSWR<{ ato: { fileSearchEnabled: boolean } }>(
    atoId ? `/api/ato/${atoId}` : null,
    fetcher
  );
  const canUploadFiles = atoId
    ? Boolean(atoData?.ato?.fileSearchEnabled)
    : true;
  const isAtoUpload = Boolean(atoId);
  const maxChatImages = entitlements.foundersAccess ? 10 : 5;
  const maxChatVideos = 1;
  const chatUploadPlanLabel = entitlements.foundersAccess ? "Founders" : "Free";
  const isNamcChatRoute = (chatRouteKey ?? "").toLowerCase() === "namc";

  // Detect when user types "/" at the start to show suggestions
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === "/" || trimmed.startsWith("/")) {
      const match = trimmed.match(/^\/([^\s/]*)$/);
      if (match) {
        setShowSlashSuggestions(true);
      } else {
        setShowSlashSuggestions(false);
      }
    } else {
      setShowSlashSuggestions(false);
    }
  }, [input]);

  const handleSlashSelect = useCallback(
    (slash: string, options?: { atoId?: string }) => {
      setInput(`/${slash}/ `);
      setShowSlashSuggestions(false);
      onSelectAto?.(options?.atoId ?? null);
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
    [onSelectAto, setInput]
  );

  const handleStartRecording = useCallback(async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const supportedMimeType = preferredMimeTypes.find((type) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
          ? MediaRecorder.isTypeSupported(type)
          : false
      );
      const mediaRecorder = new MediaRecorder(
        stream,
        supportedMimeType ? { mimeType: supportedMimeType } : undefined
      );
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const rawType =
          supportedMimeType || audioChunks[0]?.type || "audio/webm";
        const normalizedType = rawType.split(";")[0] || "audio/webm";
        const audioBlob = new Blob(audioChunks, { type: normalizedType });

        // Send to speech-to-text API
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const transcribedText = data.text || "";
            setRecordedText(transcribedText);
            setInput((prev) => prev + (prev ? " " : "") + transcribedText);
          } else {
            let errorMessage = "Failed to transcribe audio";
            try {
              const data = await response.json();
              if (data?.error) {
                errorMessage = data.error;
              }
            } catch (parseError) {
              console.error("STT error response parsing failed:", parseError);
            }
            toast.error(errorMessage);
          }
        } catch (error) {
          console.error("STT error:", error);
          toast.error("Speech-to-text failed");
        } finally {
          // Stop all tracks
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Microphone access error:", error);
      toast.error("Microphone access denied");
      // Clean up stream if it was created but MediaRecorder failed
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [setInput]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  }, [isRecording]);

  const submitForm = useCallback(() => {
    const params = new URLSearchParams();
    if (atoId) {
      params.set("atoId", atoId);
    }
    const nextUrl = params.toString()
      ? `/chat/${chatId}?${params.toString()}`
      : `/chat/${chatId}`;
    window.history.pushState({}, "", nextUrl);

    const parsedAction = parseSlashAction(input);
    const promptText = parsedAction?.prompt ?? input;
    if (
      isNamcChatRoute &&
      TRAILER_PROMPT_REGEX.test(promptText.trim()) &&
      attachments.length === 0
    ) {
      setIsTrailerMenuOpen(true);
      setLocalStorageInput("");
      resetHeight();
      setInput("");
      return;
    }

    // Check for route change if chat has existing messages and routeKey
    if (parsedAction && messages.length > 0 && chatRouteKey) {
      const currentAgent = getAgentConfigById(chatRouteKey);
      const newAgent = getAgentConfigBySlash(parsedAction.slash);

      if (
        currentAgent &&
        newAgent &&
        currentAgent.id !== newAgent.id &&
        newAgent.id !== "default"
      ) {
        // User is trying to change routes - show modal
        setRouteChangeModal({
          open: true,
          currentRoute: currentAgent.slash,
          newRoute: newAgent.slash,
          draftMessage: input,
        });
        return; // Don't send the message
      }
    }

    if (parsedAction) {
      rememberSlashAction(parsedAction);
    }

    sendMessage({
      role: "user",
      parts: [
        ...attachments.map((attachment) => ({
          type: "file" as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: "text",
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    atoId,
    resetHeight,
    messages.length,
    chatRouteKey,
    isNamcChatRoute,
  ]);

  const isPdfFile = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImageFile = (file: File) => file.type.startsWith("image/");
  const isVideoFile = (file: File) => file.type.startsWith("video/");
  const isChatMediaFile = (file: File) =>
    isImageFile(file) || isVideoFile(file) || isPdfFile(file);

  const getChatAttachmentCounts = useCallback(
    (currentAttachments: Attachment[]) => ({
      images: currentAttachments.filter((attachment) =>
        attachment.contentType?.startsWith("image/")
      ).length,
      videos: currentAttachments.filter((attachment) =>
        attachment.contentType?.startsWith("video/")
      ).length,
    }),
    []
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!canUploadFiles) {
        toast.error("File uploads are disabled for this ATO.");
        return;
      }

      if (isAtoUpload) {
        if (!isPdfFile(file)) {
          toast.error("Only PDF files are accepted for ATO uploads.");
          return;
        }
      } else if (!isChatMediaFile(file)) {
        toast.error(
          "Only images, videos, or PDFs are accepted in chat uploads."
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      if (atoId) {
        formData.append("atoId", atoId);
      }

      try {
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const { url, pathname, contentType } = data;

          return {
            url,
            name: pathname,
            contentType,
          };
        }
        const { error } = await response.json();
        toast.error(error);
      } catch (_error) {
        toast.error("Failed to upload file, please try again!");
      }
    },
    [atoId, canUploadFiles, isAtoUpload, isChatMediaFile, isPdfFile]
  );

  const handleFilesForUpload = useCallback(
    async (incomingFiles: File[]) => {
      if (!canUploadFiles) {
        toast.error("File uploads are disabled for this ATO.");
        return;
      }

      if (incomingFiles.length === 0) {
        return;
      }

      let validFiles = incomingFiles;

      if (isAtoUpload) {
        validFiles = incomingFiles.filter((file) => isPdfFile(file));
        if (validFiles.length !== incomingFiles.length) {
          toast.error("Only PDF files are accepted for ATO uploads.");
        }
      } else {
        validFiles = incomingFiles.filter((file) => isChatMediaFile(file));
        if (validFiles.length !== incomingFiles.length) {
          toast.error(
            "Only images, videos, or PDFs are accepted in chat uploads."
          );
        }

        const { images: existingImages, videos: existingVideos } =
          getChatAttachmentCounts(attachments);
        let remainingImages = maxChatImages - existingImages;
        let remainingVideos = maxChatVideos - existingVideos;
        const filteredFiles: File[] = [];
        let rejectedImages = 0;
        let rejectedVideos = 0;

        for (const file of validFiles) {
          if (isImageFile(file)) {
            if (remainingImages > 0) {
              filteredFiles.push(file);
              remainingImages -= 1;
            } else {
              rejectedImages += 1;
            }
          } else if (isVideoFile(file)) {
            if (remainingVideos > 0) {
              filteredFiles.push(file);
              remainingVideos -= 1;
            } else {
              rejectedVideos += 1;
            }
          }
        }

        if (rejectedImages > 0) {
          toast.error(
            `Image upload limit reached. ${chatUploadPlanLabel} plans allow up to ${maxChatImages} images per message.`
          );
        }

        if (rejectedVideos > 0) {
          toast.error("Only 1 video can be added per message.");
        }

        validFiles = filteredFiles;
      }

      if (validFiles.length === 0) {
        return;
      }

      setUploadQueue(validFiles.map((file) => file.name));

      try {
        const uploadPromises = validFiles.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [
      attachments,
      canUploadFiles,
      chatUploadPlanLabel,
      getChatAttachmentCounts,
      isAtoUpload,
      isChatMediaFile,
      isImageFile,
      isPdfFile,
      isVideoFile,
      maxChatImages,
      maxChatVideos,
      setAttachments,
      uploadFile,
    ]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      await handleFilesForUpload(files);
    },
    [handleFilesForUpload]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!canUploadFiles) {
        toast.error("File uploads are disabled for this ATO.");
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const fileItems = Array.from(items).filter(
        (item) => item.kind === "file"
      );

      if (fileItems.length === 0) {
        return;
      }

      if (isAtoUpload) {
        toast.error("Only PDF files are accepted for ATO uploads.");
        event.preventDefault();
        return;
      }

      const files = fileItems
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

      if (files.length > 0) {
        event.preventDefault();
        await handleFilesForUpload(files);
      }
    },
    [canUploadFiles, handleFilesForUpload, isAtoUpload]
  );

  // Add paste event listener to textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const shouldShowMenuPanel =
    messages.length === 0 &&
    attachments.length === 0 &&
    uploadQueue.length === 0;

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Toggle profile panel"
            aria-pressed={activeMenu === "profile"}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm transition hover:border-border",
              activeMenu === "profile" && "border-primary/60 ring-2 ring-primary/20"
            )}
            onClick={() =>
              setActiveMenu((current) =>
                current === "profile" ? null : "profile"
              )
            }
            type="button"
          >
            <Image
              alt={session?.user?.email ?? "Guest"}
              className="rounded-full"
              height={32}
              src={avatarSrc}
              width={32}
            />
          </button>
          <ChatSwipeMenu
            activeItemId={activeMenu}
            className="min-w-0 flex-1 justify-start sm:justify-center"
            items={
              [
                { id: "profile", label: "Profile" },
                { id: "history", label: "History" },
              ] as const
            }
            onChange={setActiveMenu}
          />
        </div>
        {activeMenu === "history" && shouldShowMenuPanel && (
          <SuggestedActions
            chatId={chatId}
            messages={messages}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}
        {activeMenu === "profile" && <ChatProfilePanel />}
      </div>

      <input
        accept={
          isAtoUpload ? "application/pdf" : "image/*,video/*,application/pdf"
        }
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        disabled={!canUploadFiles}
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <PromptInput
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim() && attachments.length === 0) {
            return;
          }
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex flex-row items-end gap-2 overflow-x-scroll"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <div className="relative grow">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-auto p-2 text-base leading-6 tracking-normal text-foreground [-ms-overflow-style:none] [scrollbar-width:none] [white-space:pre-wrap] [word-break:break-word] [&::-webkit-scrollbar]:hidden"
              ref={overlayRef}
            >
              {slashPrefix ? (
                <>
                  <span
                    className="cloud-button cloud-button--inline inline-flex items-center px-2 py-0.5 text-foreground"
                    ref={slashPrefixRef}
                  >
                    {slashPrefix}
                  </span>
                  <span>{slashRemainder}</span>
                </>
              ) : (
                <span>{input}</span>
              )}
            </div>
            <PromptInputTextarea
              className="grow resize-none border-0! border-none! bg-transparent p-2 text-base leading-6 tracking-normal text-transparent caret-foreground outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
              data-testid="multimodal-input"
              disableAutoResize={true}
              maxHeight={200}
              minHeight={44}
              onChange={handleInput}
              onScroll={(event) => {
                if (overlayRef.current) {
                  overlayRef.current.scrollTop = event.currentTarget.scrollTop;
                  overlayRef.current.scrollLeft =
                    event.currentTarget.scrollLeft;
                }
              }}
              placeholder="Send a message..."
              ref={textareaRef}
              rows={1}
              style={
                slashPrefixIndent
                  ? { textIndent: `${slashPrefixIndent}px` }
                  : undefined
              }
              value={input}
            />
          </div>
        </div>
        <PromptInputToolbar className="border-top-0! border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            <AttachmentsButton
              fileInputRef={fileInputRef}
              isUploadEnabled={canUploadFiles}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
            <Button
              className={cn(
                "aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent",
                isRecording && "bg-red-500 text-white hover:bg-red-600"
              )}
              data-testid="mic-button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              type="button"
              variant="ghost"
            >
              {isRecording ? (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                </div>
              ) : (
                <MicIcon />
              )}
            </Button>
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              data-testid="send-button"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
            >
              <ArrowUpIcon size={14} />
            </PromptInputSubmit>
          )}
        </PromptInputToolbar>
      </PromptInput>

      <Dialog onOpenChange={setIsTrailerMenuOpen} open={isTrailerMenuOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Let's watch trailers</DialogTitle>
            <DialogDescription>
              Choose a concept trailer and we'll open the NAMC player.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {NAMC_TRAILERS.map((trailer) => (
              <button
                className="flex flex-col gap-1 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-left text-sm transition hover:border-foreground/40 hover:bg-muted/50"
                key={trailer.id}
                onClick={() => {
                  setIsTrailerMenuOpen(false);
                  router.push(
                    `/NAMC/library/trailers?trailer=${encodeURIComponent(
                      trailer.id
                    )}`
                  );
                }}
                type="button"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {trailer.category}
                </span>
                <span className="font-semibold">{trailer.title}</span>
                <span className="text-xs text-muted-foreground">
                  {trailer.subtitle}
                </span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsTrailerMenuOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsTrailerMenuOpen(false);
                router.push("/NAMC/library/trailers");
              }}
              type="button"
            >
              Open player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slash suggestions dropdown */}
      {showSlashSuggestions && (
        <SlashSuggestions
          onClose={() => setShowSlashSuggestions(false)}
          onSelect={handleSlashSelect}
        />
      )}

      {/* Route change modal */}
      <RouteChangeModal
        currentRoute={routeChangeModal.currentRoute}
        draftMessage={routeChangeModal.draftMessage}
        newRoute={routeChangeModal.newRoute}
        onOpenChange={(open) =>
          setRouteChangeModal((prev) => ({ ...prev, open }))
        }
        open={routeChangeModal.open}
      />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.chatRouteKey !== nextProps.chatRouteKey) {
      return false;
    }
    if (prevProps.atoId !== nextProps.atoId) {
      return false;
    }

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
  isUploadEnabled,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
  isUploadEnabled: boolean;
}) {
  const isReasoningModel =
    selectedModelId.includes("reasoning") || selectedModelId.includes("think");

  return (
    <Button
      className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
      data-testid="attachments-button"
      disabled={status !== "ready" || isReasoningModel || !isUploadEnabled}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedModel =
    chatModels.find((m) => m.id === selectedModelId) ??
    chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
    chatModels[0];
  const [provider] = selectedModel.id.split("/");

  // Provider display names
  const providerNames: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google",
    xai: "xAI",
    reasoning: "Reasoning",
  };

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button className="h-8 w-[200px] justify-between px-2" variant="ghost">
          {provider && <ModelSelectorLogo provider={provider} />}
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          {Object.entries(modelsByProvider).map(
            ([providerKey, providerModels]) => (
              <ModelSelectorGroup
                heading={providerNames[providerKey] ?? providerKey}
                key={providerKey}
              >
                {providerModels.map((model) => {
                  const logoProvider = model.id.split("/")[0];
                  return (
                    <ModelSelectorItem
                      key={model.id}
                      onSelect={() => {
                        onModelChange?.(model.id);
                        setCookie("chat-model", model.id);
                        setOpen(false);
                      }}
                      value={model.id}
                    >
                      <ModelSelectorLogo provider={logoProvider} />
                      <ModelSelectorName>{model.name}</ModelSelectorName>
                      {model.id === selectedModel.id && (
                        <CheckIcon className="ml-auto size-4" />
                      )}
                    </ModelSelectorItem>
                  );
                })}
              </ModelSelectorGroup>
            )
          )}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
