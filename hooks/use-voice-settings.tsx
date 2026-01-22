"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

export type ChatVoiceSettings = Record<string, { voiceId: string }>;

const STORAGE_KEY = "chat-voice-settings";

export const useVoiceSettingsMap = () => {
  const [settings, setSettings] = useLocalStorage<ChatVoiceSettings>(
    STORAGE_KEY,
    {}
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
