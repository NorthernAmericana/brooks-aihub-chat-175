"use client";

import {
  AlertCircle,
  ExternalLink,
  Link2Off,
  Radio,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";

export default function SpotifyPage() {
  const {
    playerState,
    isConnected,
    isPlayerReady,
    isFallbackMode,
    sdkUnavailableReason,
    error,
    controlMessage,
    dismissControlMessage,
    refreshState,
    togglePlayback,
    skipNext,
    skipPrevious,
    startRadio,
    openSpotify,
    openSpotifyArtist,
    openSpotifyContext,
  } = useSpotifyPlayback();
  const [disconnecting, setDisconnecting] = useState(false);

  const disconnectSpotify = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/spotify/disconnect", {
        method: "POST",
        credentials: "include",
      });
      window.location.reload();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050b07] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#0d1e15] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
            Spotify
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Music Player Console</h1>
          <p className="mt-2 text-sm text-white/70">App route: /Spotify/</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-3 py-1 text-emerald-100">
              {isFallbackMode
                ? "Fallback mode (server controls)"
                : isConnected && isPlayerReady
                  ? "SDK connected"
                  : "Connecting SDK..."}
            </span>
            <button
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90 hover:bg-white/20"
              onClick={() => refreshState()}
              type="button"
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
              Refresh state
            </button>
            <button
              className="rounded-full border border-rose-300/40 bg-rose-500/20 px-3 py-1 text-rose-100 hover:bg-rose-500/30 disabled:opacity-60"
              disabled={disconnecting}
              onClick={disconnectSpotify}
              type="button"
            >
              <Link2Off className="mr-1 inline h-3.5 w-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect Spotify"}
            </button>
          </div>
        </header>

        {sdkUnavailableReason ? (
          <section className="rounded-2xl border border-amber-300/40 bg-amber-500/15 p-4 text-sm text-amber-100">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {sdkUnavailableReason}
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-sm text-rose-100">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </section>
        ) : null}

        {controlMessage ? (
          <section className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-sm text-rose-100">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {controlMessage}
            <button
              className="ml-3 rounded-full border border-rose-300/40 px-2 py-0.5 text-xs"
              onClick={dismissControlMessage}
              type="button"
            >
              Dismiss
            </button>
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-emerald-200/90">Now playing</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {playerState?.item?.name ?? "Nothing currently playing"}
          </h2>
          <p className="text-sm text-white/70">
            {playerState?.item?.artists
              ?.map((artist) => artist.name)
              .join(", ") || "Open Spotify on any device and start playback."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10"
              onClick={() => skipPrevious()}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-full bg-emerald-500 px-5 py-2 font-semibold text-black hover:bg-emerald-400"
              onClick={() => togglePlayback()}
              type="button"
            >
              {playerState?.is_playing ? "Pause" : "Play"}
            </button>
            <button
              className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10"
              onClick={() => skipNext()}
              type="button"
            >
              Next
            </button>
            <button
              className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-cyan-100 hover:bg-cyan-500/30"
              onClick={() => startRadio()}
              type="button"
            >
              <Radio className="mr-1 inline h-4 w-4" /> Start radio
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Open in Spotify</h3>
          <p className="mt-2 text-sm text-white/70">
            Deep links for current track, artist, and playlist/context.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30"
              onClick={openSpotify}
              type="button"
            >
              <ExternalLink className="mr-2 inline h-4 w-4" /> Open track
            </button>
            <button
              className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/30"
              onClick={openSpotifyArtist}
              type="button"
            >
              <ExternalLink className="mr-2 inline h-4 w-4" /> Open artist
            </button>
            <button
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-4 py-2 text-sm font-medium text-fuchsia-100 hover:bg-fuchsia-500/30"
              onClick={openSpotifyContext}
              type="button"
            >
              <ExternalLink className="mr-2 inline h-4 w-4" /> Open
              playlist/context
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
