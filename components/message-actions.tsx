import equal from "fast-deep-equal";
import { memo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useChatVoiceSettings } from "@/hooks/use-voice-settings";
import {
  getDefaultVoiceId,
  getOfficialVoice,
  getRouteKey,
  getRouteVoiceOptions,
  getVoiceLabel,
} from "@/lib/voice";
import { Action, Actions } from "./elements/actions";
import {
  CheckCircleFillIcon,
  CopyIcon,
  MoreHorizontalIcon,
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
  const routeKey = getRouteKey(chatTitle);
  const officialVoice = getOfficialVoice(routeKey);
  const voiceOptions = getRouteVoiceOptions(routeKey);
  const defaultVoiceId = getDefaultVoiceId(routeKey);
  const { selectedVoiceId, setVoiceId } = useChatVoiceSettings(
    chatId,
    defaultVoiceId
  );
  const selectedVoiceLabel = selectedVoiceId
    ? getVoiceLabel(selectedVoiceId, routeKey)
    : officialVoice;

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
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

  const handleSpeak = async () => {
    if (!textFromParts) {
      toast.error("There's no response text to read yet.");
      return;
    }

    if (voiceOptions.length === 0 || !selectedVoiceId) {
      toast("Voice playback is only available for /NAMC/ chats right now.", {
        description: `Route voice: ${officialVoice} • Route: ${
          routeKey === "default" ? "General" : `/${routeKey}/`
        }`,
      });
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setIsSpeaking(true);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textFromParts,
          voiceId: selectedVoiceId,
        }),
      });

      if (!response.ok) {
        setIsSpeaking(false);
        toast.error("Failed to start ElevenLabs playback.");
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        toast.error("Playback failed.");
      };

      await audio.play();
    } catch (error) {
      setIsSpeaking(false);
      toast.error("Unable to start playback.");
    }
  };

  return (
    <Actions className="-ml-0.5">
      <Action
        disabled={isSpeaking}
        onClick={handleSpeak}
        tooltip={`Speak (${selectedVoiceLabel})`}
      >
        <SpeakerIcon />
      </Action>
      {voiceOptions.length > 0 ? (
        <DropdownMenu modal={true}>
          <DropdownMenuTrigger asChild>
            <Action tooltip="Choose voice">
              <MoreHorizontalIcon />
            </Action>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            {voiceOptions.map((voice) => (
              <DropdownMenuItem
                className="cursor-pointer flex-row justify-between"
                key={voice.id}
                onSelect={(event) => {
                  event.preventDefault();
                  setVoiceId(voice.id);
                }}
              >
                <span>{voice.label}</span>
                {voice.id === selectedVoiceId ? (
                  <CheckCircleFillIcon />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
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
