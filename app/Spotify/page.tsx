"use client";

import {
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useMemo, useState } from "react";

const mockTracks = [
  { title: "Night Drive", artist: "Synthia Lane", duration: "3:24" },
  { title: "City Echo", artist: "Future Arcade", duration: "4:02" },
  { title: "Aurora Static", artist: "Neon Atlas", duration: "2:58" },
];

export default function SpotifyPage() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [radioStatus, setRadioStatus] = useState("Idle");

  const track = useMemo(
    () => mockTracks[currentTrackIndex],
    [currentTrackIndex]
  );

  return (
    <main className="min-h-screen bg-[#050b07] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#0d1e15] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
            Spotify
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Music Player Console</h1>
          <p className="mt-2 text-sm text-white/70">App route: /Spotify/</p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-emerald-200/90">Now playing</p>
          <h2 className="mt-2 text-2xl font-semibold">{track.title}</h2>
          <p className="text-sm text-white/70">
            {track.artist} · {track.duration}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-white/20 p-3 hover:bg-white/10"
              onClick={() =>
                setCurrentTrackIndex(
                  (prev) => (prev - 1 + mockTracks.length) % mockTracks.length
                )
              }
              type="button"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              className="rounded-full bg-emerald-500 p-4 text-black hover:bg-emerald-400"
              onClick={() => setIsPlaying((prev) => !prev)}
              type="button"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              className="rounded-full border border-white/20 p-3 hover:bg-white/10"
              onClick={() =>
                setCurrentTrackIndex((prev) => (prev + 1) % mockTracks.length)
              }
              type="button"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <label className="mt-6 block text-sm text-white/80">
            <span className="mb-2 inline-flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Volume: {volume}%
            </span>
            <input
              className="w-full accent-emerald-500"
              max={100}
              min={0}
              onChange={(event) => setVolume(Number(event.target.value))}
              type="range"
              value={volume}
            />
          </label>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Radio actions</h3>
          <p className="mt-2 text-sm text-white/70">
            Quick actions for generating stations from current listening
            context.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30"
              onClick={() => setRadioStatus("Artist Radio started")}
              type="button"
            >
              <Radio className="mr-2 inline h-4 w-4" />
              Start Artist Radio
            </button>
            <button
              className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/30"
              onClick={() => setRadioStatus("Track Radio started")}
              type="button"
            >
              <Radio className="mr-2 inline h-4 w-4" />
              Start Track Radio
            </button>
            <button
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-4 py-2 text-sm font-medium text-fuchsia-100 hover:bg-fuchsia-500/30"
              onClick={() => setRadioStatus("Discovery Mix queued")}
              type="button"
            >
              <Radio className="mr-2 inline h-4 w-4" />
              Queue Discovery Mix
            </button>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Status:{" "}
            <span className="font-semibold text-emerald-200">
              {radioStatus}
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
