"use client";

import { useCallback, useEffect, useState } from "react";
import { PROFILE_ICON_STORAGE_KEY } from "@/lib/profile-icon";

export function useProfileIcon() {
  const [profileIcon, setProfileIconState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

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

  const setProfileIcon = useCallback((value: string | null) => {
    if (typeof window === "undefined") {
      return;
    }

    if (value) {
      window.localStorage.setItem(PROFILE_ICON_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(PROFILE_ICON_STORAGE_KEY);
    }

    setProfileIconState(value);
  }, []);

  return {
    isReady,
    profileIcon,
    setProfileIcon,
  };
}
