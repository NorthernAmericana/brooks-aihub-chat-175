"use client";

import { useCallback, useEffect, useState } from "react";

export type ChatVoiceSettings = Record<string, { voiceId: string }>;

const STORAGE_KEY = "chat-voice-settings";

export const useVoiceSettingsMap = () => {
  const [settings, setSettingsState] = useState<ChatVoiceSettings>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettingsState(JSON.parse(stored) as ChatVoiceSettings);
      }
    } catch {
      setSettingsState({});
    }
  }, []);

  const setSettings = useCallback(
    (
      next:
        | ChatVoiceSettings
        | ((previous: ChatVoiceSettings) => ChatVoiceSettings)
    ) => {
      setSettingsState((previous) => {
        const resolved = typeof next === "function" ? next(previous) : next;
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
          } catch {
            // Ignore localStorage write errors.
          }
        }
        return resolved;
      });
    },
    []
  );

  return { settings, setSettings };
};

export const useChatVoiceSettings = (
  chatId: string,
  defaultVoiceId: string
) => {
  const { settings, setSettings } = useVoiceSettingsMap();
  const selectedVoiceId = settings[chatId]?.voiceId ?? defaultVoiceId;

  const setVoiceId = useCallback(
    (voiceId: string) => {
      setSettings((previous) => ({
        ...previous,
        [chatId]: { voiceId },
      }));
    },
    [chatId, setSettings]
  );

  return { selectedVoiceId, setVoiceId };
};
