"use client";

import { ArrowLeft, Library } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const preorderWindow = "Preorder until early 2027";
const comboPrice = "$24.99";

const preorderEntries = [
  {
    id: "mdd-video-game",
    title: "My Daughter, Death: The Video Game",
    subtitle: "Early Access",
    summary:
      "Atmospheric narrative game set in the frostbound pocket-reality of New Bethlehem.",
    standalonePrice: "$14.99",
  },
  {
    id: "mdd-frostbitten-novel",
    title: "My Daughter, Death: Frostbitten: The Novel",
    subtitle: "Full Novel Release",
    summary:
      "The full novel release of Frostbitten, expanding the canon beyond the game.",
    standalonePrice: "$9.99",
  },
] as const;

export default function NamcLibraryPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 woodsy-base soft-vignette">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,4,0.15),rgba(10,6,4,0.78))]" />
      <div className="relative flex h-dvh flex-col text-white">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              onClick={() => router.back()}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-white/80" />
              <h1 className="font-pixel text-lg text-[#f6e6c8]">Library</h1>
            </div>
          </div>
          <Link
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
            href="/NAMC"
          >
            Home
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain sm:px-6">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Coming online
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
              Collection shelves, playlists, and project hubs
            </h2>
            <p className="mt-2 text-sm text-white/75">
              This route is a placeholder for the full NAMC library experience.
              It will host shelves for videos, albums, games, lore docs, and
              saved playlists.
            </p>
          </div>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Preorder spotlight
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                  My Daughter, Death release lineup
                </h2>
              </div>
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold text-white/80">
                {preorderWindow}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/75">
              Two preorder placeholders live now. The combo pack includes the
              novel and game together for {comboPrice}.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {preorderEntries.map((entry) => (
                <div
                  className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
                  key={entry.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                      Preorder placeholder
                    </span>
                    <span className="text-xs text-white/60">{preorderWindow}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[#f6e6c8]">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-white/70">
                    {entry.subtitle}
                  </p>
                  <p className="mt-3 text-sm text-white/75">{entry.summary}</p>

                  <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                    <div className="flex items-center justify-between gap-2">
                      <span>Combo preorder (Game + Novel)</span>
                      <span className="font-semibold text-[#f6e6c8]">
                        {comboPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {entry.id === "mdd-video-game"
                          ? "Early access game"
                          : "Novel only"}
                      </span>
                      <span className="font-semibold text-[#f6e6c8]">
                        {entry.standalonePrice}
                      </span>
                    </div>
                  </div>

                  <button
                    className="mt-4 w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white/70"
                    disabled
                    type="button"
                  >
                    Preorder link coming soon
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
