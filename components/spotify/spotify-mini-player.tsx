"use client";

import {
  AlertCircle,
  ExternalLink,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useMemo } from "react";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SpotifyMiniPlayer() {
  const {
    playerState,
    isConnected,
    isPlayerReady,
    isFallbackMode,
    sdkUnavailableReason,
    controlMessage,
    dismissControlMessage,
    togglePlayback,
    skipNext,
    skipPrevious,
    seekTo,
    startRadio,
    openSpotify,
    openSpotifyArtist,
    openSpotifyContext,
  } = useSpotifyPlayback();

  const track = playerState?.item;
  const progress = playerState?.progress_ms ?? 0;
  const duration = track?.duration_ms ?? 0;

  const progressPercent = useMemo(() => {
    if (!duration) {
      return 0;
    }
    return Math.min(100, (progress / duration) * 100);
  }, [duration, progress]);

  if (!track) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-emerald-200/30 bg-[#0a130f]/90 p-3 text-white shadow-2xl backdrop-blur-md md:left-auto md:w-[24rem]">
      <div className="flex items-center gap-3">
        <ImageWithFallback
          alt={track.name}
          className="h-12 w-12 rounded-lg object-cover"
          containerClassName="h-12 w-12"
          height={48}
          src={
            track.album.images[0]?.url ??
            "/icons/spotify-music-player-appicon.svg"
          }
          width={48}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{track.name}</p>
          <p className="truncate text-xs text-white/70">
            {track.artists.map((artist) => artist.name).join(", ")}
          </p>
          <p className="text-[10px] text-emerald-200/80">
            {isFallbackMode
              ? "Fallback mode"
              : isConnected && isPlayerReady
                ? "Connected"
                : "Reconnecting"}
          </p>
        </div>
      </div>

      {sdkUnavailableReason ? (
        <div className="mt-2 rounded-lg border border-amber-300/40 bg-amber-500/20 px-2 py-1 text-[10px] text-amber-100">
          {sdkUnavailableReason}
        </div>
      ) : null}

      {controlMessage ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-300/40 bg-rose-500/20 px-2 py-1 text-[10px] text-rose-100">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <div className="flex-1">{controlMessage}</div>
          <button
            className="rounded px-1 text-[10px] text-rose-100/80 hover:bg-rose-500/20"
            onClick={dismissControlMessage}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mt-2">
        <input
          aria-label="Seek track"
          className="w-full accent-emerald-500"
          max={duration || 1}
          min={0}
          onChange={(event) => seekTo(Number(event.target.value))}
          type="range"
          value={Math.min(progress, duration || 1)}
        />
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/70">
          <span>{formatMs(progress)}</span>
          <span>{Math.round(progressPercent)}%</span>
          <span>{formatMs(duration)}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-white/20 p-2"
          onClick={() => {
            skipPrevious();
          }}
          type="button"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          className="rounded-full bg-emerald-500 p-2 text-black"
          onClick={() => {
            togglePlayback();
          }}
          type="button"
        >
          {playerState?.is_playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          className="rounded-full border border-white/20 p-2"
          onClick={() => {
            skipNext();
          }}
          type="button"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <button
          className="rounded-full border border-cyan-300/40 bg-cyan-500/20 p-2 text-cyan-100"
          onClick={() => {
            startRadio();
          }}
          type="button"
        >
          <Radio className="h-4 w-4" />
        </button>
        <button
          className="ml-auto rounded-full border border-emerald-300/40 bg-emerald-500/20 p-2 text-emerald-100"
          onClick={openSpotify}
          title="Open track in Spotify"
          type="button"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          className="rounded-full border border-cyan-300/40 bg-cyan-500/20 p-2 text-cyan-100"
          onClick={openSpotifyArtist}
          title="Open artist in Spotify"
          type="button"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 p-2 text-fuchsia-100"
          onClick={openSpotifyContext}
          title="Open playlist/context in Spotify"
          type="button"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
