"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAudioFocus } from "@/components/audio-focus-provider";

const SPOTIFY_SDK_URL = "https://sdk.scdn.co/spotify-player.js";

type SpotifyApiError = {
  error?: {
    message?: string;
  };
};

type PlaybackImage = { url: string };
type PlaybackArtist = { name: string };

type PlaybackTrack = {
  id: string;
  name: string;
  artists: PlaybackArtist[];
  album: { images: PlaybackImage[] };
  uri: string;
  duration_ms: number;
};

type PlaybackContext = {
  uri?: string | null;
};

type PlaybackState = {
  is_playing: boolean;
  progress_ms: number;
  item: PlaybackTrack | null;
  context?: PlaybackContext | null;
};

type SpotifyPlayerInit = {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume?: number;
};

type SpotifyWebPlaybackTrack = {
  id: string;
  name: string;
  uri: string;
  album: { images: PlaybackImage[] };
  artists: Array<{ name: string }>;
};

type SpotifyWebPlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyWebPlaybackTrack;
  };
};

type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: any) => void) => void;
};

type SpotifyPlaybackContextValue = {
  isActivated: boolean;
  deviceId: string | null;
  playerState: PlaybackState | null;
  isPlayerReady: boolean;
  isConnected: boolean;
  isLoading: boolean;
  isFallbackMode: boolean;
  error: string | null;
  sdkUnavailableReason: string | null;
  controlMessage: string | null;
  activate: () => void;
  refreshState: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  startRadio: () => Promise<void>;
  openSpotify: () => void;
  openSpotifyArtist: () => void;
  openSpotifyContext: () => void;
  dismissControlMessage: () => void;
};

const SpotifyPlaybackContext =
  createContext<SpotifyPlaybackContextValue | null>(null);

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as SpotifyApiError | null)?.error?.message ??
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function loadSpotifySdk() {
  if (window.Spotify?.Player) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${SPOTIFY_SDK_URL}"]`,
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.src = SPOTIFY_SDK_URL;
    script.async = true;
    document.body.appendChild(script);
  }

  return new Promise<void>((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });
}

export function SpotifyPlaybackProvider({ children }: { children: ReactNode }) {
  const { setSpotifyIsPlaying } = useAudioFocus();
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const mountedRef = useRef(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlaybackState | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkUnavailableReason, setSdkUnavailableReason] = useState<
    string | null
  >(null);
  const [controlMessage, setControlMessage] = useState<string | null>(null);

  const mapUiError = useCallback((message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("premium")) {
      return "Spotify Premium is required to control playback from this app.";
    }
    if (normalized.includes("no active") || normalized.includes("device")) {
      return "No active Spotify device found. Start playback in Spotify and try again.";
    }
    if (normalized.includes("denied") || normalized.includes("forbidden")) {
      return "Spotify rejected this action for your account or current device.";
    }
    return message;
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchJson<PlaybackState | null>(
        "/api/spotify/player",
      );
      if (!mountedRef.current) {
        return;
      }
      setPlayerState(state);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to load player state";
      setError(mapUiError(message));
    }
  }, [mapUiError]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const activate = useCallback(() => {
    if (isActivated) {
      return;
    }

    setIsLoading(true);
    setIsActivated(true);
  }, [isActivated]);

  useEffect(() => {
    if (!isActivated) {
      return;
    }

    let pollInterval = 0;

    const setup = async () => {
      try {
        await loadSpotifySdk();
        if (!window.Spotify?.Player || !mountedRef.current) {
          setIsFallbackMode(true);
          setSdkUnavailableReason(
            "Spotify Web Playback SDK is unavailable. Using fallback controls.",
          );
          await refreshState();
          return;
        }

        const player = new window.Spotify.Player({
          name: "Brooks AI HUB Player",
          volume: 0.8,
          getOAuthToken: async (callback) => {
            try {
              const token = await fetchJson<{ accessToken: string }>(
                "/api/spotify/token",
              );
              callback(token.accessToken);
            } catch (err) {
              setError(
                err instanceof Error
                  ? mapUiError(err.message)
                  : "Unable to load Spotify token",
              );
            }
          },
        });

        playerRef.current = player;

        player.addListener("ready", ({ device_id }) => {
          setDeviceId(device_id);
          setIsPlayerReady(true);
        });

        player.addListener("not_ready", () => setIsPlayerReady(false));

        player.addListener(
          "player_state_changed",
          (state: SpotifyWebPlaybackState) => {
            if (!state?.track_window.current_track) {
              return;
            }

            setPlayerState({
              is_playing: !state.paused,
              progress_ms: state.position,
              item: {
                id: state.track_window.current_track.id,
                name: state.track_window.current_track.name,
                artists: state.track_window.current_track.artists.map(
                  (artist) => ({
                    name: artist.name,
                  }),
                ),
                album: {
                  images: state.track_window.current_track.album.images,
                },
                uri: state.track_window.current_track.uri,
                duration_ms: state.duration,
              },
            });
          },
        );

        player.addListener("authentication_error", ({ message }) => {
          setError(mapUiError(message));
          setIsFallbackMode(true);
          setSdkUnavailableReason(
            "Spotify Web Playback SDK authentication failed. Using fallback controls.",
          );
        });

        player.addListener("account_error", ({ message }) => {
          setError(mapUiError(message));
          setIsFallbackMode(true);
          setSdkUnavailableReason(
            "Spotify denied Web Playback on this account/device. Using fallback controls.",
          );
        });

        player.addListener("playback_error", ({ message }) => {
          setError(mapUiError(message));
        });

        const connected = await player.connect();
        if (!mountedRef.current) {
          return;
        }

        setIsConnected(connected);
        setIsFallbackMode(!connected);
        if (!connected) {
          setSdkUnavailableReason(
            "Could not connect Spotify Web Playback SDK. Using fallback controls.",
          );
        }
        if (connected) {
          await refreshState();
          pollInterval = window.setInterval(() => {
            refreshState().catch(() => undefined);
          }, 10_000);
        }
      } catch (err) {
        setIsFallbackMode(true);
        const message =
          err instanceof Error ? err.message : "Failed to initialize Spotify";
        setError(mapUiError(message));
        setSdkUnavailableReason(
          "Spotify Web Playback SDK failed to load. Using fallback controls.",
        );
        await refreshState();
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    setup().catch(() => undefined);

    return () => {
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [isActivated, mapUiError, refreshState]);

  useEffect(() => {
    setSpotifyIsPlaying(Boolean(playerState?.is_playing));
  }, [playerState?.is_playing, setSpotifyIsPlaying]);

  useEffect(() => {
    return () => {
      setSpotifyIsPlaying(false);
    };
  }, [setSpotifyIsPlaying]);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    fetchJson("/api/spotify/player/transfer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, play: false }),
    }).catch(() => undefined);
  }, [deviceId]);

  const runPlayerAction = useCallback(
    async (url: string, init?: RequestInit) => {
      try {
        await fetchJson(url, init);
        setControlMessage(null);
      } catch (err) {
        const message = mapUiError(
          err instanceof Error ? err.message : "Spotify rejected this action",
        );
        setControlMessage(message);
      } finally {
        await refreshState();
      }
    },
    [mapUiError, refreshState],
  );

  const togglePlayback = useCallback(async () => {
    await runPlayerAction(
      playerState?.is_playing
        ? "/api/spotify/player/pause"
        : "/api/spotify/player/play",
      { method: "PUT" },
    );
  }, [playerState?.is_playing, runPlayerAction]);

  const skipNext = useCallback(async () => {
    await runPlayerAction("/api/spotify/player/next", { method: "POST" });
  }, [runPlayerAction]);

  const skipPrevious = useCallback(async () => {
    await runPlayerAction("/api/spotify/player/previous", { method: "POST" });
  }, [runPlayerAction]);

  const seekTo = useCallback(
    async (positionMs: number) => {
      await runPlayerAction(
        `/api/spotify/player/seek?position_ms=${Math.max(0, Math.floor(positionMs))}`,
        { method: "PUT" },
      );
    },
    [runPlayerAction],
  );

  const startRadio = useCallback(async () => {
    const trackId = playerState?.item?.id;
    if (!trackId) {
      return;
    }

    const recommendations = await fetchJson<{
      tracks?: Array<{ uri: string }>;
    }>(`/api/spotify/recommendations?seed_tracks=${trackId}&limit=1`);

    const uri = recommendations.tracks?.[0]?.uri;
    if (!uri) {
      return;
    }

    await runPlayerAction("/api/spotify/player/play", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri] }),
    });
  }, [playerState?.item?.id, runPlayerAction]);

  const openSpotify = useCallback(() => {
    const trackUri = playerState?.item?.uri;
    const href = trackUri?.startsWith("spotify:track:")
      ? trackUri.replace("spotify:track:", "https://open.spotify.com/track/")
      : "https://open.spotify.com";
    window.open(href, "_blank", "noopener,noreferrer");
  }, [playerState?.item?.uri]);

  const openSpotifyArtist = useCallback(() => {
    const artistName = playerState?.item?.artists?.[0]?.name;
    const href = artistName
      ? `https://open.spotify.com/search/${encodeURIComponent(artistName)}`
      : "https://open.spotify.com";
    window.open(href, "_blank", "noopener,noreferrer");
  }, [playerState?.item?.artists]);

  const openSpotifyContext = useCallback(() => {
    const contextUri = playerState?.context?.uri;

    if (contextUri?.startsWith("spotify:playlist:")) {
      window.open(
        contextUri.replace(
          "spotify:playlist:",
          "https://open.spotify.com/playlist/",
        ),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    openSpotify();
  }, [openSpotify, playerState?.context?.uri]);

  const dismissControlMessage = useCallback(() => {
    setControlMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      isActivated,
      deviceId,
      playerState,
      isPlayerReady,
      isConnected,
      isLoading,
      isFallbackMode,
      error,
      sdkUnavailableReason,
      controlMessage,
      activate,
      refreshState,
      togglePlayback,
      skipNext,
      skipPrevious,
      seekTo,
      startRadio,
      openSpotify,
      openSpotifyArtist,
      openSpotifyContext,
      dismissControlMessage,
    }),
    [
      isActivated,
      deviceId,
      playerState,
      isPlayerReady,
      isConnected,
      isLoading,
      isFallbackMode,
      error,
      sdkUnavailableReason,
      controlMessage,
      activate,
      refreshState,
      togglePlayback,
      skipNext,
      skipPrevious,
      seekTo,
      startRadio,
      openSpotify,
      openSpotifyArtist,
      openSpotifyContext,
      dismissControlMessage,
    ],
  );

  return (
    <SpotifyPlaybackContext.Provider value={value}>
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}

export function useSpotifyPlayback() {
  const context = useContext(SpotifyPlaybackContext);
  if (!context) {
    throw new Error(
      "useSpotifyPlayback must be used inside SpotifyPlaybackProvider",
    );
  }
  return context;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: SpotifyPlayerInit) => SpotifyPlayer;
    };
  }
}
