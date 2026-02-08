import equal from "fast-deep-equal";
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { getChatRouteKey, getOfficialVoiceId } from "@/lib/voice";
import { useUserMessageColor } from "@/hooks/use-user-message-color";
import { Action, Actions } from "./elements/actions";
import {
  CopyIcon,
  MenuIcon,
  PencilEditIcon,
  SpeakerIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function PureMessageActions({
  chatId,
  chatRouteKey,
  chatTitle,
  message,
  vote,
  isLoading,
  setMode,
}: {
  chatId: string;
  chatRouteKey?: string | null;
  chatTitle: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { messageColor, setMessageColor } = useUserMessageColor();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [pickerColor, setPickerColor] = useState(messageColor);

  useEffect(() => {
    setPickerColor(messageColor);
  }, [messageColor]);

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const requestThemeAudioResume = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new Event("brooks-ai-hub:resume-theme-audio"));
  };

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  const handleSpeak = async () => {
    // If already playing, stop current playback and start fresh
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setIsPlaying(false);
      audioRef.current = null;
      return;
    }

    if (!textFromParts) {
      toast.error("There's no response text to read yet.");
      return;
    }

    const loadingToast = toast.loading("Generating speech...");
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Fetch chat settings to get persisted voice and enabled state
      const chatResponse = await fetch(`/api/chat-settings?chatId=${chatId}`);
      if (!chatResponse.ok) {
        toast.error("Failed to load chat settings.");
        return;
      }

      const chatData = await chatResponse.json();

      // Check if TTS is disabled for this chat
      if (chatData.ttsEnabled === false) {
        toast.error(
          "Text-to-speech is disabled for this chat. Enable it in voice settings."
        );
        return;
      }

      // Determine voice ID: use persisted setting or route default
      const routeKey = getChatRouteKey({
        routeKey: chatRouteKey,
        title: chatTitle,
      });
      const voiceId = chatData.ttsVoiceId || getOfficialVoiceId(routeKey);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch("/api/tts/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textFromParts, voiceId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message =
          errorPayload?.error ?? "Unable to generate speech right now.";
        toast.error(message);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audio.preload = "auto";
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        setIsPlaying(false);
        audioRef.current = null;
      });

      audio.addEventListener("error", () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        setIsPlaying(false);
        audioRef.current = null;
        toast.error("Audio playback failed.");
      });

      setIsPlaying(true);
      const playPromise = audio.play();
      requestThemeAudioResume();
      await playPromise;
      toast.success("Playing response.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("Speech request timed out.");
      } else {
        toast.error("Unable to generate speech right now.");
      }
      setIsPlaying(false);
      audioRef.current = null;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      toast.dismiss(loadingToast);
    }
  };

  // User messages get edit (on hover) and copy actions
  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end">
        <div className="relative flex items-center gap-1">
          {setMode && (
            <Action
              className="absolute top-0 -left-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/message:opacity-100"
              data-testid="message-edit-button"
              onClick={() => setMode("edit")}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action onClick={handleCopy} tooltip="Copy">
            <CopyIcon />
          </Action>
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                setIsColorPickerOpen(false);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Action tooltip="Message color">
                <MenuIcon />
              </Action>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setIsColorPickerOpen((previous) => !previous);
                }}
              >
                Change color text bar
              </DropdownMenuItem>
              {isColorPickerOpen && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Pick</span>
                  <input
                    aria-label="Message color picker"
                    className="h-7 w-7 cursor-pointer rounded-full border border-border p-0"
                    onChange={async (event) => {
                      const nextColor = event.target.value;
                      setPickerColor(nextColor);
                      try {
                        await setMessageColor(nextColor);
                        toast.success("Message color updated.");
                      } catch (_error) {
                        toast.error("Unable to save message color.");
                      }
                    }}
                    type="color"
                    value={pickerColor}
                  />
                  <button
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setIsColorPickerOpen(false)}
                    type="button"
                  >
                    Done
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleCopy} tooltip="Copy">
        <CopyIcon />
      </Action>

      <Action
        data-testid="message-speak"
        onClick={handleSpeak}
        tooltip={isPlaying ? "Stop playback" : "Read aloud"}
      >
        <SpeakerIcon />
      </Action>

      <Action
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={() => {
          const upvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "up",
            }),
          });

          toast.promise(upvote, {
            loading: "Upvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: true,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Upvoted Response!";
            },
            error: "Failed to upvote response.",
          });
        }}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={() => {
          const downvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "down",
            }),
          });

          toast.promise(downvote, {
            loading: "Downvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: false,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Downvoted Response!";
            },
            error: "Failed to downvote response.",
          });
        }}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
