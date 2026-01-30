"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Chat } from "@/lib/db/schema";
import {
  getChatRouteKey,
  getDefaultVoice,
  getVoiceOptions,
  type VoiceOption,
} from "@/lib/voice";

type VoiceSettingsPanelProps = {
  chats: Chat[];
};

// Helper function to get display name for route
const getRouteDisplayName = (routeKey: string): string => {
  const routeNames: Record<string, string> = {
    "brooks-ai-hub": "/Brooks AI HUB/",
    namc: "/NAMC/",
    "namc-mdd": "/NAMC/MDD/",
    "namc-ghostgirl": "/NAMC/ghostgirl/",
    "brooks-bears": "/BrooksBears/",
    brooksbears: "/BrooksBears/",
    "my-car-mind": "/MyCarMindATO/",
    mycarmindato: "/MyCarMindATO/",
    "my-flower-ai": "/MyFlowerAI/",
    myflowerai: "/MyFlowerAI/",
    nat: "/NAT/",
    "unofficial-ato": "/Unofficial ATO/",
    default: "Default",
  };
  return routeNames[routeKey] ?? `/${routeKey}/`;
};

export const VoiceSettingsPanel = ({ chats }: VoiceSettingsPanelProps) => {
  // Show all chats since Brooks AI HUB voice is now available for non-NAMC routes
  const namcChats = useMemo(() => chats, [chats]);

  const defaultSelections = useMemo(
    () =>
      namcChats.reduce<Record<string, VoiceOption>>((accumulator, chat) => {
        const routeKey = getChatRouteKey(chat);
        const defaultVoice = getDefaultVoice(routeKey);
        const savedVoiceId = chat.ttsVoiceId ?? defaultVoice.id;
        const savedVoiceLabel = chat.ttsVoiceLabel ?? defaultVoice.label;
        accumulator[chat.id] = {
          id: savedVoiceId,
          label: savedVoiceLabel,
        };
        return accumulator;
      }, {}),
    [namcChats]
  );

  const [selectedVoices, setSelectedVoices] =
    useState<Record<string, VoiceOption>>(defaultSelections);

  const [speakerEnabled, setSpeakerEnabled] = useState<Record<string, boolean>>(
    () =>
      namcChats.reduce<Record<string, boolean>>((accumulator, chat) => {
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
      namcChats.forEach((chat) => {
        if (typeof next[chat.id] !== "boolean") {
          next[chat.id] = chat.ttsEnabled ?? true;
        }
      });
      return next;
    });
  }, [namcChats]);

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

  if (namcChats.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No chats yet. Start a conversation to configure voice options.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {namcChats.map((chat) => {
        const routeKey = getChatRouteKey(chat);
        const defaultVoice = getDefaultVoice(routeKey);
        const voiceOptions = getVoiceOptions(routeKey);

        const voiceLookup = new Map(
          voiceOptions.map((option) => [option.id, option])
        );

        const currentVoice = selectedVoices[chat.id] ?? defaultVoice;

        return (
          <div
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            key={chat.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  Route: {getRouteDisplayName(routeKey)} • Default:{" "}
                  {defaultVoice.label}
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
                    void persistSettings({
                      chatId: chat.id,
                      ttsEnabled: nextEnabled,
                      ttsVoiceId: currentVoice.id,
                      ttsVoiceLabel: currentVoice.label,
                    });
                  }}
                  type="checkbox"
                />
                Voice enabled
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`voice-select-${chat.id}`}>Voice selection</Label>
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
                  {voiceOptions.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label}
                      {voice.id === defaultVoice.id ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {voiceOptions.length > 1
                  ? `Choose from ${voiceOptions.length} available voices for this route. Use the three-dot menu in chat to switch voices quickly.`
                  : `${defaultVoice.label} is the only voice available for this route.`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
