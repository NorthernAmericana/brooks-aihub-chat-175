"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { PROFILE_ICON_STORAGE_KEY } from "@/lib/profile-icon";

type UserSettingsResponse = {
  avatarUrl?: string | null;
};

const fetchUserSettings = async (): Promise<UserSettingsResponse | null> => {
  try {
    const response = await fetch("/api/user-settings");

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as UserSettingsResponse;
  } catch (_error) {
    return null;
  }
};

export function useProfileIcon() {
  const [profileIcon, setProfileIconState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { data, mutate } = useSWR<UserSettingsResponse | null>(
    "/api/user-settings",
    fetchUserSettings,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedIcon = window.localStorage.getItem(PROFILE_ICON_STORAGE_KEY);
    setProfileIconState(storedIcon);
    setIsReady(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_ICON_STORAGE_KEY) {
        setProfileIconState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (
      !isReady ||
      typeof window === "undefined" ||
      data === undefined ||
      data === null
    ) {
      return;
    }

    const remoteAvatar = data?.avatarUrl ?? null;

    if (remoteAvatar) {
      window.localStorage.setItem(PROFILE_ICON_STORAGE_KEY, remoteAvatar);
      setProfileIconState(remoteAvatar);
      return;
    }

    window.localStorage.removeItem(PROFILE_ICON_STORAGE_KEY);
    setProfileIconState(null);
  }, [data, isReady]);

  const setProfileIcon = useCallback(
    async (value: string | null) => {
      if (typeof window === "undefined") {
        return;
      }

      if (value) {
        window.localStorage.setItem(PROFILE_ICON_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(PROFILE_ICON_STORAGE_KEY);
      }

      setProfileIconState(value);

      try {
        const response = await fetch("/api/user-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update avatar");
        }

        const updated = (await response.json()) as UserSettingsResponse;
        mutate(updated, false);
      } catch (_error) {
        // Keep local preference as a fallback for guests/offline users.
      }
    },
    [mutate]
  );

  return {
    isReady,
    profileIcon,
    setProfileIcon,
  };
}
