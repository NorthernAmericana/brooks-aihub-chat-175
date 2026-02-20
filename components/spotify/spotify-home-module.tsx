"use client";

import { Link2, Music2 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";
import { cn, fetcher } from "@/lib/utils";

type SpotifyStatus = {
  connected: boolean;
};

export function SpotifyHomeModule() {
  const { data } = useSWR<SpotifyStatus>("/api/spotify/status", fetcher);
  const { playerState, togglePlayback } = useSpotifyPlayback();

  const hasTrack = Boolean(playerState?.item);

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
          <p className="truncate text-sm font-semibold">
            {hasTrack ? playerState?.item?.name : "Nothing playing"}
          </p>
          <p className="truncate text-xs text-white/70">
            {hasTrack
              ? playerState?.item?.artists.map((artist) => artist.name).join(", ")
              : "Open Spotify and start a track to control playback."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                playerState?.is_playing
                  ? "bg-amber-500/30 text-amber-100"
                  : "bg-emerald-500 text-black",
              )}
              onClick={() => {
                togglePlayback();
              }}
              type="button"
            >
              {playerState?.is_playing ? "Pause" : "Play"}
            </button>
            <Link
              className="rounded-full border border-white/20 px-3 py-1 text-xs"
              href="/Spotify"
            >
              Open full player
            </Link>
          </div>
        </div>
      ) : (
        <Link
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-100"
          href="/spotify-app"
        >
          <Link2 className="h-3.5 w-3.5" />
          Connect Spotify
        </Link>
      )}
    </div>
  );
}
