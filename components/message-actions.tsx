import equal from "fast-deep-equal";
import { memo, useRef } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { getOfficialVoiceId, getRouteKey } from "@/lib/voice";
import { Action, Actions } from "./elements/actions";
import {
  CopyIcon,
  PencilEditIcon,
  SpeakerIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";

export function PureMessageActions({
  chatId,
  chatTitle,
  message,
  vote,
  isLoading,
  setMode,
}: {
  chatId: string;
  chatTitle: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
  
  // Track currently playing audio to prevent overlapping playback
  const currentAudioRef = useRef<{
    audio: HTMLAudioElement;
    url: string;
  } | null>(null);

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  const handleSpeak = async () => {
    if (!textFromParts) {
      toast.error("There's no response text to read yet.");
      return;
    }

    // Stop any currently playing audio from this message
    if (currentAudioRef.current) {
      const { audio, url } = currentAudioRef.current;
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(url);
      currentAudioRef.current = null;
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
      const routeKey = getRouteKey(chatTitle);
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
      const audio = new Audio(audioUrl);

      // Store reference to current audio
      currentAudioRef.current = { audio, url: audioUrl };

      // Wait for audio to be fully buffered before playing to prevent stuttering
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener(
          "canplaythrough",
          () => resolve(),
          { once: true }
        );
        audio.addEventListener(
          "error",
          () => reject(new Error("Audio load failed")),
          { once: true }
        );
        audio.load();
      });

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current?.url === audioUrl) {
          currentAudioRef.current = null;
        }
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current?.url === audioUrl) {
          currentAudioRef.current = null;
        }
        toast.error("Audio playback failed.");
      });

      await audio.play();
      toast.success("Playing response.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("Speech request timed out.");
      } else {
        toast.error("Unable to generate speech right now.");
      }
      // Clean up on error
      if (currentAudioRef.current) {
        const { audio, url } = currentAudioRef.current;
        audio.pause();
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      }
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
        <div className="relative">
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
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleSpeak} tooltip="Speak">
        <SpeakerIcon />
      </Action>
      <Action onClick={handleCopy} tooltip="Copy">
        <CopyIcon />
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
