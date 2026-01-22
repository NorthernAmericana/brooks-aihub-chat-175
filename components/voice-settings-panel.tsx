"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Chat } from "@/lib/db/schema";
import {
  getOfficialVoice,
  getRouteKey,
  getVoiceOptions,
  type VoiceOption,
} from "@/lib/voice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VoiceSettingsPanelProps = {
  chats: Chat[];
};

export const VoiceSettingsPanel = ({ chats }: VoiceSettingsPanelProps) => {
  const defaultSelections = useMemo(
    () =>
      chats.reduce<Record<string, VoiceOption>>((accumulator, chat) => {
        const routeKey = getRouteKey(chat.title);
        const fallbackVoice = getOfficialVoice(routeKey);
        const savedVoiceId = chat.ttsVoiceId ?? fallbackVoice;
        const savedVoiceLabel = chat.ttsVoiceLabel ?? savedVoiceId;
        accumulator[chat.id] = {
          id: savedVoiceId,
          label: savedVoiceLabel,
        };
        return accumulator;
      }, {}),
    [chats]
  );
  const [selectedVoices, setSelectedVoices] =
    useState<Record<string, VoiceOption>>(defaultSelections);
  const [speakerEnabled, setSpeakerEnabled] = useState<Record<string, boolean>>(
    () =>
      chats.reduce<Record<string, boolean>>((accumulator, chat) => {
        accumulator[chat.id] = chat.ttsEnabled ?? true;
        return accumulator;
      }, {})
  );

  useEffect(() => {
    setSelectedVoices(defaultSelections);
  }, [defaultSelections]);

  useEffect(() => {
    setSpeakerEnabled((previous) => {
      const next = { ...previous };
      chats.forEach((chat) => {
        if (typeof next[chat.id] !== "boolean") {
          next[chat.id] = chat.ttsEnabled ?? true;
        }
      });
      return next;
    });
  }, [chats]);

  const persistSettings = async ({
    chatId,
    ttsEnabled,
    ttsVoiceId,
    ttsVoiceLabel,
  }: {
    chatId: string;
    ttsEnabled: boolean;
    ttsVoiceId: string;
    ttsVoiceLabel: string;
  }) => {
    try {
      const response = await fetch("/api/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          ttsEnabled,
          ttsVoiceId,
          ttsVoiceLabel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update chat voice settings.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to save voice settings.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {chats.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          No chats yet. Start a chat to configure route-specific voices.
        </div>
      ) : (
        chats.map((chat) => {
          const routeKey = getRouteKey(chat.title);
          const officialVoice = getOfficialVoice(routeKey);
          const routeVoiceOptions = getVoiceOptions(routeKey);
          const voiceOptions = [
            { id: officialVoice, label: officialVoice },
            ...routeVoiceOptions,
          ];
          const voiceLookup = new Map(
            voiceOptions.map((option) => [option.id, option])
          );
          const routeLabel =
            routeKey === "default" ? "General" : `/${routeKey}/`;
          const currentVoice =
            selectedVoices[chat.id] ?? voiceOptions[0] ?? {
              id: officialVoice,
              label: officialVoice,
            };

          return (
            <div
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
              key={chat.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Route: {routeLabel} • Official voice: {officialVoice}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    checked={speakerEnabled[chat.id] ?? true}
                    className="h-4 w-4 accent-foreground"
                    onChange={(event) => {
                      const nextEnabled = event.target.checked;
                      setSpeakerEnabled((previous) => ({
                        ...previous,
                        [chat.id]: nextEnabled,
                      }));
                      const voice = selectedVoices[chat.id] ?? {
                        id: officialVoice,
                        label: officialVoice,
                      };
                      void persistSettings({
                        chatId: chat.id,
                        ttsEnabled: nextEnabled,
                        ttsVoiceId: voice.id,
                        ttsVoiceLabel: voice.label,
                      });
                    }}
                    type="checkbox"
                  />
                  Speaker enabled
                </label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`voice-select-${chat.id}`}>
                  Voice selection (per chat)
                </Label>
                <Select
                  onValueChange={(value) => {
                    const option =
                      voiceLookup.get(value) ??
                      ({
                        id: value,
                        label: value,
                      } satisfies VoiceOption);
                    setSelectedVoices((previous) => ({
                      ...previous,
                      [chat.id]: option,
                    }));
                    void persistSettings({
                      chatId: chat.id,
                      ttsEnabled: speakerEnabled[chat.id] ?? true,
                      ttsVoiceId: option.id,
                      ttsVoiceLabel: option.label,
                    });
                  }}
                  value={currentVoice.id}
                >
                  <SelectTrigger id={`voice-select-${chat.id}`}>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={officialVoice}>
                      {officialVoice} (Route official)
                    </SelectItem>
                    {routeVoiceOptions.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This is a placeholder. Playback wiring will follow later.
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
