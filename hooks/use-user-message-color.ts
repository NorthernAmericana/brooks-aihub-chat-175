"use client";

import { useCallback } from "react";
import useSWR from "swr";

const DEFAULT_MESSAGE_COLOR = "#006cff";

type UserSettingsResponse = {
  messageColor?: string | null;
};

const fetchUserSettings = async (): Promise<UserSettingsResponse> => {
  try {
    const response = await fetch("/api/user-settings");
    if (!response.ok) {
      return { messageColor: DEFAULT_MESSAGE_COLOR };
    }
    return response.json();
  } catch (_error) {
    return { messageColor: DEFAULT_MESSAGE_COLOR };
  }
};

export function useUserMessageColor() {
  const { data, mutate, isLoading } = useSWR<UserSettingsResponse>(
    "/api/user-settings",
    fetchUserSettings,
    {
      revalidateOnFocus: false,
    }
  );

  const messageColor = data?.messageColor ?? DEFAULT_MESSAGE_COLOR;

  const setMessageColor = useCallback(
    async (nextColor: string | null) => {
      const response = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageColor: nextColor }),
      });

      if (!response.ok) {
        throw new Error("Failed to update message color.");
      }

      const updated = (await response.json()) as UserSettingsResponse;
      mutate(updated, false);
    },
    [mutate]
  );

  return {
    isLoading,
    messageColor,
    setMessageColor,
  };
}

export { DEFAULT_MESSAGE_COLOR };
