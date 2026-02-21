"use client";

import { Link2, Music2 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn, fetcher } from "@/lib/utils";

type SpotifyStatus = {
  connected: boolean;
};

export function SpotifyHomeModule() {
  const { data } = useSWR<SpotifyStatus>("/api/spotify/status", fetcher);
  const { isActivated, activate, playerState, togglePlayback, skipNext } =
    useSpotifyPlayback();

  const hasTrack = Boolean(playerState?.item);
  const playlistLabel = (() => {
    const contextUri = playerState?.context?.uri;
    if (!contextUri?.startsWith("spotify:playlist:")) {
      return null;
    }

    const playlistId = contextUri.replace("spotify:playlist:", "");
    return playlistId ? `Playlist ${playlistId.slice(0, 8)}` : "Playlist";
  })();

  return (
    <div className="mb-6 w-full rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-4 text-left shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
            Spotify Player
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.connected
              ? "Spotify connected for playback in Brooks AI HUB."
              : "Connect Spotify to enable quick controls."}
          </p>
        </div>
        <Music2 className="h-5 w-5 text-emerald-200" />
      </div>

      {data?.connected ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          {isActivated ? (
            <>
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  alt={playerState?.item?.name ?? "Spotify album art"}
                  className="h-10 w-10 rounded-md object-cover"
                  containerClassName="h-10 w-10 shrink-0"
                  height={40}
                  src={
                    playerState?.item?.album?.images?.[0]?.url ??
                    "/icons/spotify-music-player-appicon.svg"
                  }
                  width={40}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {hasTrack ? playerState?.item?.name : "Nothing playing"}
                  </p>
                  <p className="truncate text-xs text-white/70">
                    {hasTrack
                      ? playerState?.item?.artists
                          ?.map((artist) => artist.name)
                          .join(", ")
                      : "Open Spotify and start a track to control playback."}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    playerState?.is_playing
                      ? "bg-amber-500/30 text-amber-100"
                      : "bg-emerald-500 text-black"
                  )}
                  onClick={() => {
                    togglePlayback();
                  }}
                  type="button"
                >
                  {playerState?.is_playing ? "Pause" : "Play"}
                </button>
                <button
                  className="rounded-full border border-white/20 px-3 py-1 text-xs"
                  onClick={() => {
                    skipNext();
                  }}
                  type="button"
                >
                  Skip
                </button>
                <Link
                  className="rounded-full border border-white/20 px-3 py-1 text-xs"
                  href="/Spotify"
                  onClick={activate}
                >
                  Open full player{playlistLabel ? ` • ${playlistLabel}` : ""}
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-white/75">
                Open Spotify controls when you want to start playback control in
                this session.
              </p>
              <Link
                className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs"
                href="/Spotify"
                onClick={activate}
              >
                Open Spotify controls
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Link
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-100"
          href="/spotify-app"
          onClick={activate}
        >
          <Link2 className="h-3.5 w-3.5" />
          Connect Spotify
        </Link>
      )}
    </div>
  );
}
