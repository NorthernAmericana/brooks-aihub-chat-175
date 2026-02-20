"use client";

import {
  AlertCircle,
  ExternalLink,
  Link2,
  Link2Off,
  MessageCircle,
  Music2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSpotifyPlayback } from "@/components/spotify/spotify-playback-provider";

export default function SpotifyPage() {
  const {
    playerState,
    isActivated,
    activate,
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
    openSpotify,
  } = useSpotifyPlayback();

  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  useEffect(() => {
    activate();
  }, [activate]);

  const shouldShowConnectCta =
    Boolean(error) &&
    /(not connected|unauthorized|invalid|reconnect)/i.test(error ?? "");

  const disconnectSpotify = async () => {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      const response = await fetch("/api/spotify/disconnect", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setDisconnectError(
          "Unable to disconnect Spotify right now. Please try again.",
        );
        return;
      }

      window.location.reload();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050b07] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-[#0d1e15] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
            Spotify chat mode
          </p>
          <h1 className="mt-2 text-3xl font-semibold">/Spotify/</h1>
          <p className="mt-2 text-sm text-white/75">
            Music recommendations + taste memory in chat, with compact playback controls below.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
              href={`/brooks-ai-hub?query=${encodeURIComponent("/Spotify/")}`}
            >
              <MessageCircle className="h-4 w-4" />
              Open Spotify chat
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              href="/spotify-app"
            >
              <Link2 className="h-4 w-4" />
              Spotify connection settings
            </Link>
            <button
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/20"
              onClick={() => refreshState()}
              type="button"
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
              Refresh state
            </button>
            <button
              className="rounded-full border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/30 disabled:opacity-60"
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
            {shouldShowConnectCta ? (
              <div className="mt-3">
                <Link
                  className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                  href="/api/spotify/login"
                >
                  Connect Spotify
                </Link>
              </div>
            ) : null}
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

        {disconnectError ? (
          <section className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-sm text-rose-100">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {disconnectError}
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-200/90">Embedded player panel</p>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-emerald-100">
              {isFallbackMode
                ? "Fallback"
                : isConnected && isPlayerReady
                  ? "Connected"
                  : isActivated
                    ? "Preparing"
                    : "Idle"}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20">
                <Music2 className="h-5 w-5 text-emerald-100" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {playerState?.item?.name ?? "Nothing currently playing"}
                </p>
                <p className="truncate text-xs text-white/70">
                  {playerState?.item?.artists
                    ?.map((artist) => artist.name)
                    .join(", ") || "Play something in Spotify to enable controls."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                onClick={() => skipPrevious()}
                type="button"
              >
                Prev
              </button>
              <button
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400"
                onClick={() => togglePlayback()}
                type="button"
              >
                {playerState?.is_playing ? "Pause" : "Play"}
              </button>
              <button
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                onClick={() => skipNext()}
                type="button"
              >
                Next
              </button>
              <button
                className="ml-auto rounded-full border border-emerald-300/40 bg-emerald-500/20 p-2 text-emerald-100"
                onClick={openSpotify}
                title="Open current track in Spotify"
                type="button"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
