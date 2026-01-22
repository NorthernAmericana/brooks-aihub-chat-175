"use client";

import { useEffect, useState } from "react";
import type { Chat } from "@/lib/db/schema";
import {
  getDefaultVoiceId,
  getOfficialVoice,
  getRouteKey,
  getRouteVoiceOptions,
} from "@/lib/voice";
import { useVoiceSettingsMap } from "@/hooks/use-voice-settings";
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
  const { settings, setSettings } = useVoiceSettingsMap();
  const [speakerEnabled, setSpeakerEnabled] = useState<Record<string, boolean>>(
    () =>
      chats.reduce<Record<string, boolean>>((accumulator, chat) => {
        accumulator[chat.id] = true;
        return accumulator;
      }, {})
  );

  useEffect(() => {
    setSettings((previous) => {
      const next = { ...previous };
      chats.forEach((chat) => {
        const routeKey = getRouteKey(chat.title);
        const defaultVoiceId = getDefaultVoiceId(routeKey);
        if (!defaultVoiceId) {
          return;
        }
        if (!next[chat.id]?.voiceId) {
          next[chat.id] = { voiceId: defaultVoiceId };
        }
      });
      return next;
    });
  }, [chats, setSettings]);

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
          const voiceOptions = getRouteVoiceOptions(routeKey);
          const defaultVoiceId = getDefaultVoiceId(routeKey);
          const selectedVoiceId =
            settings[chat.id]?.voiceId ?? defaultVoiceId;

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
                {voiceOptions.length > 0 ? (
                  <>
                    <Label htmlFor={`voice-select-${chat.id}`}>
                      NAMC voice selection (per chat)
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setSettings((previous) => ({
                          ...previous,
                          [chat.id]: { voiceId: value },
                        }))
                      }
                      value={selectedVoiceId}
                    >
                      <SelectTrigger id={`voice-select-${chat.id}`}>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for ElevenLabs playback on /NAMC/ chats.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Voice selection is only available for /NAMC/ chats right
                    now.
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
