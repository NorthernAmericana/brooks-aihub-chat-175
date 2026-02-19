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

type PlaybackState = {
  is_playing: boolean;
  progress_ms: number;
  item: PlaybackTrack | null;
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
  deviceId: string | null;
  playerState: PlaybackState | null;
  isPlayerReady: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  startRadio: () => Promise<void>;
  openSpotify: () => void;
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
    `script[src="${SPOTIFY_SDK_URL}"]`
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
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const mountedRef = useRef(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlaybackState | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const state = await fetchJson<PlaybackState | null>(
        "/api/spotify/player"
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
      setError(
        err instanceof Error ? err.message : "Unable to load player state"
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let pollInterval = 0;

    const setup = async () => {
      try {
        await loadSpotifySdk();
        if (!window.Spotify?.Player || !mountedRef.current) {
          return;
        }

        const player = new window.Spotify.Player({
          name: "Brooks AI HUB Player",
          volume: 0.8,
          getOAuthToken: async (callback) => {
            try {
              const token = await fetchJson<{ accessToken: string }>(
                "/api/spotify/token"
              );
              callback(token.accessToken);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Unable to load Spotify token"
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
                  })
                ),
                album: {
                  images: state.track_window.current_track.album.images,
                },
                uri: state.track_window.current_track.uri,
                duration_ms: state.duration,
              },
            });
          }
        );

        player.addListener("authentication_error", ({ message }) => {
          setError(message);
        });

        player.addListener("account_error", ({ message }) => {
          setError(message);
        });

        player.addListener("playback_error", ({ message }) => {
          setError(message);
        });

        const connected = await player.connect();
        if (!mountedRef.current) {
          return;
        }

        setIsConnected(connected);
        if (connected) {
          await refreshState();
          pollInterval = window.setInterval(() => {
            refreshState().catch(() => undefined);
          }, 10_000);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize Spotify"
        );
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
  }, [refreshState]);

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
      await fetchJson(url, init);
      await refreshState();
    },
    [refreshState]
  );

  const togglePlayback = useCallback(async () => {
    await runPlayerAction(
      playerState?.is_playing
        ? "/api/spotify/player/pause"
        : "/api/spotify/player/play",
      { method: "PUT" }
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
        { method: "PUT" }
      );
    },
    [runPlayerAction]
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

  const value = useMemo(
    () => ({
      deviceId,
      playerState,
      isPlayerReady,
      isConnected,
      isLoading,
      error,
      refreshState,
      togglePlayback,
      skipNext,
      skipPrevious,
      seekTo,
      startRadio,
      openSpotify,
    }),
    [
      deviceId,
      playerState,
      isPlayerReady,
      isConnected,
      isLoading,
      error,
      refreshState,
      togglePlayback,
      skipNext,
      skipPrevious,
      seekTo,
      startRadio,
      openSpotify,
    ]
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
      "useSpotifyPlayback must be used inside SpotifyPlaybackProvider"
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
