"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type AudioOutputMode = "theme" | "spotify" | "muted";

type AudioFocusContextValue = {
  spotifyIsPlaying: boolean;
  themeAudioEnabled: boolean;
  effectiveOutputMode: AudioOutputMode;
  setSpotifyIsPlaying: (isPlaying: boolean) => void;
  setThemeAudioEnabled: (enabled: boolean) => void;
};

const AudioFocusContext = createContext<AudioFocusContextValue | null>(null);

export function AudioFocusProvider({ children }: { children: ReactNode }) {
  const [spotifyIsPlaying, setSpotifyIsPlaying] = useState(false);
  const [themeAudioEnabled, setThemeAudioEnabled] = useState(true);

  const effectiveOutputMode: AudioOutputMode = useMemo(() => {
    if (spotifyIsPlaying) {
      return "spotify";
    }
    if (themeAudioEnabled) {
      return "theme";
    }
    return "muted";
  }, [spotifyIsPlaying, themeAudioEnabled]);

  const value = useMemo(
    () => ({
      spotifyIsPlaying,
      themeAudioEnabled,
      effectiveOutputMode,
      setSpotifyIsPlaying,
      setThemeAudioEnabled,
    }),
    [spotifyIsPlaying, themeAudioEnabled, effectiveOutputMode]
  );

  return (
    <AudioFocusContext.Provider value={value}>
      {children}
    </AudioFocusContext.Provider>
  );
}

export function useAudioFocus() {
  const context = useContext(AudioFocusContext);
  if (!context) {
    throw new Error("useAudioFocus must be used within an AudioFocusProvider");
  }

  return context;
}
