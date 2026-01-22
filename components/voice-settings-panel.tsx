"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chat } from "@/lib/db/schema";
import { getOfficialVoice, getRouteKey, VOICE_OPTIONS } from "@/lib/voice";
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
      chats.reduce<Record<string, string>>((accumulator, chat) => {
        const routeKey = getRouteKey(chat.title);
        accumulator[chat.id] = getOfficialVoice(routeKey);
        return accumulator;
      }, {}),
    [chats]
  );
  const [selectedVoices, setSelectedVoices] =
    useState<Record<string, string>>(defaultSelections);
  const [speakerEnabled, setSpeakerEnabled] = useState<Record<string, boolean>>(
    () =>
      chats.reduce<Record<string, boolean>>((accumulator, chat) => {
        accumulator[chat.id] = true;
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
          next[chat.id] = true;
        }
      });
      return next;
    });
  }, [chats]);

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
          const routeLabel =
            routeKey === "default" ? "General" : `/${routeKey}/`;

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
                    onChange={(event) =>
                      setSpeakerEnabled((previous) => ({
                        ...previous,
                        [chat.id]: event.target.checked,
                      }))
                    }
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
                  onValueChange={(value) =>
                    setSelectedVoices((previous) => ({
                      ...previous,
                      [chat.id]: value,
                    }))
                  }
                  value={selectedVoices[chat.id] ?? officialVoice}
                >
                  <SelectTrigger id={`voice-select-${chat.id}`}>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={officialVoice}>
                      {officialVoice} (Route official)
                    </SelectItem>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
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
