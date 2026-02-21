"use client";

import { ExternalLink, MoreVertical, Pause, Play, Radio } from "lucide-react";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

type NowPlayingStripProps = {
  className?: string;
};

export function NowPlayingStrip({ className }: NowPlayingStripProps) {
  const {
    playerState,
    togglePlayback,
    startRadio,
    openSpotify,
    openSpotifyArtist,
    openSpotifyContext,
  } = useSpotifyPlayback();

  const track = playerState?.item;

  if (!track) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full max-w-full overflow-hidden rounded-xl border border-emerald-300/30 bg-[#0a130f]/85 px-2 py-1.5 text-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[#0a130f]/70 sm:px-3",
        className
      )}
    >
      <div className="flex min-h-10 items-center gap-2 sm:min-h-11">
        <ImageWithFallback
          alt={track.name}
          className="h-8 w-8 rounded-md object-cover sm:h-9 sm:w-9"
          containerClassName="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
          height={36}
          src={
            track.album.images[0]?.url ??
            "/icons/spotify-music-player-appicon.svg"
          }
          width={36}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight sm:text-sm">
            {track.name}
          </p>
          <p className="truncate text-[10px] text-white/70 sm:text-xs">
            {track.artists.map((artist) => artist.name).join(", ")}
          </p>
        </div>

        <button
          aria-label={playerState?.is_playing ? "Pause" : "Play"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black transition hover:bg-emerald-400"
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
          aria-label="Open in Spotify"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/20 text-emerald-100 transition hover:bg-emerald-500/30"
          onClick={openSpotify}
          type="button"
        >
          <ExternalLink className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More Spotify actions"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
              type="button"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => startRadio()}>
              <Radio className="mr-2 h-4 w-4" />
              Start track radio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSpotifyArtist}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open artist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSpotifyContext}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open playlist/context
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function SpotifyTopBar() {
  return <NowPlayingStrip />;
}
