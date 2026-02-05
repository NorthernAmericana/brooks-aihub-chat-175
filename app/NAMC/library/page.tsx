"use client";

import { ArrowLeft, Library } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAMC_TRAILERS } from "@/lib/namc-trailers";

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

const conceptTrailers = NAMC_TRAILERS;

type LibraryShelf = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  meta?: string;
  accent: string;
};

type MediaPick = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  metric?: string;
};

type LaunchpadGame = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
  meta?: string;
};

const libraryShelves: LibraryShelf[] = [
  {
    id: "shelf-series",
    title: "Series & TV",
    subtitle: "Limited runs + originals",
    badge: "New",
    meta: "4 shows",
    accent:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(255,206,160,0.3),transparent_55%),linear-gradient(135deg,rgba(64,40,28,0.92),rgba(20,13,18,0.92))]",
  },
  {
    id: "shelf-games",
    title: "Games & Interactive",
    subtitle: "Playable builds + demos",
    badge: "Playable",
    meta: "3 games",
    accent:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(120,198,255,0.3),transparent_55%),linear-gradient(135deg,rgba(35,48,64,0.92),rgba(12,18,28,0.92))]",
  },
  {
    id: "shelf-trailers",
    title: "Concept trailers",
    subtitle: "Video game promos",
    badge: "Updated",
    meta: "3 videos",
    accent:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(255,225,180,0.28),transparent_55%),linear-gradient(135deg,rgba(70,44,26,0.92),rgba(20,14,18,0.92))]",
  },
  {
    id: "shelf-scores",
    title: "Scores & Albums",
    subtitle: "Ambient playlists",
    badge: "Cozy",
    meta: "6 albums",
    accent:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(255,220,130,0.3),transparent_55%),linear-gradient(135deg,rgba(115,74,42,0.92),rgba(40,24,15,0.92))]",
  },
] as const;

const seriesPicks: MediaPick[] = [
  {
    id: "series-frostbitten-files",
    title: "Frostbitten Files",
    subtitle: "Limited series",
    badge: "New",
    metric: "8 episodes",
  },
  {
    id: "series-northwood",
    title: "Northwood Afterlight",
    subtitle: "Investigative docu-series",
    metric: "S1 available",
  },
  {
    id: "series-embers",
    title: "Embers of New Bethlehem",
    subtitle: "Anthology",
    metric: "4 chapters",
  },
  {
    id: "series-archive",
    title: "Archive Tapes",
    subtitle: "Found-footage reels",
    metric: "12 clips",
  },
] as const;

const launchpadGames: LaunchpadGame[] = [
  {
    id: "launch-mdd",
    title: "My Daughter, Death: The Video Game",
    subtitle: "Early access",
    status: "Streaming build ready",
    description:
      "Launch the latest story build from mobile with cloud saves enabled.",
    ctaLabel: "Launch game",
    ctaHref: "/NAMC/library/trailers?trailer=daughter-death",
    secondaryLabel: "Watch trailers",
    secondaryHref: "/NAMC/library/trailers",
    meta: "Build 0.9.4 • 6.2 GB",
  },
  {
    id: "launch-ghost-girl",
    title: "Ghost Girl",
    subtitle: "Prototype",
    status: "Playtest waitlist",
    description:
      "Ambient narrative prototype in QA. Join the list for the next drop.",
    ctaLabel: "Join waitlist",
    ctaDisabled: true,
    meta: "Closed beta",
  },
  {
    id: "launch-night-drive",
    title: "Night Drive Notes",
    subtitle: "Demo",
    status: "Mobile demo soon",
    description:
      "Short atmospheric drive with new ambient lighting experiments.",
    ctaLabel: "Launch demo",
    ctaDisabled: true,
    meta: "Demo build queued",
  },
] as const;

function ShelfCard({ shelf }: { shelf: LibraryShelf }) {
  return (
    <div className="relative w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:w-[240px]">
      <div className={`absolute inset-0 ${shelf.accent}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.85))]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
          <span>Library shelf</span>
          {shelf.badge && (
            <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] text-white/80">
              {shelf.badge}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f6e6c8]">{shelf.title}</p>
          <p className="mt-1 text-xs text-white/70">{shelf.subtitle}</p>
        </div>
        {shelf.meta && (
          <span className="text-[11px] font-semibold text-white/70">
            {shelf.meta}
          </span>
        )}
      </div>
    </div>
  );
}

function MediaPickCard({ item }: { item: MediaPick }) {
  return (
    <div className="group relative w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition hover:border-white/25 hover:bg-white/5 sm:w-[240px]">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
        <span>Series</span>
        {item.badge && (
          <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] text-white/80">
            {item.badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#f6e6c8]">{item.title}</p>
      <p className="mt-1 text-xs text-white/70">{item.subtitle}</p>
      {item.metric && (
        <p className="mt-3 text-xs font-semibold text-white/60">
          {item.metric}
        </p>
      )}
    </div>
  );
}

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
          <section className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Library shelves
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                  A Netflix-style layout for NAMC collections
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  Browse shelves for series, games, trailers, and score albums.
                </p>
              </div>
              <Link
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                href="/NAMC/library/trailers"
              >
                Open trailer player
              </Link>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {libraryShelves.map((shelf) => (
                <ShelfCard key={shelf.id} shelf={shelf} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Game launchpad
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                  Steam-style mobile launcher
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  Launch playable builds, track releases, and jump into demos.
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold text-white/80">
                Mobile-ready
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {launchpadGames.map((game) => (
                <div
                  className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
                  key={game.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                      {game.subtitle}
                    </span>
                    <span className="text-xs text-white/60">{game.status}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-[#f6e6c8]">
                    {game.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/75">
                    {game.description}
                  </p>
                  {game.meta && (
                    <p className="mt-3 text-xs font-semibold text-white/60">
                      {game.meta}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {game.ctaHref && !game.ctaDisabled ? (
                      <Link
                        className="rounded-full bg-amber-400/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1b0f0f] transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                        href={game.ctaHref}
                      >
                        {game.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60"
                        disabled
                        type="button"
                      >
                        {game.ctaLabel}
                      </button>
                    )}
                    {game.secondaryHref && game.secondaryLabel && (
                      <Link
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                        href={game.secondaryHref}
                      >
                        {game.secondaryLabel}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                  Concept trailers
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                  Stream the My Daughter, Death promos
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  Instant playback, no hunting required.
                </p>
              </div>
              <Link
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                href="/NAMC/library/trailers"
              >
                Open full player
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {conceptTrailers.map((trailer) => (
                <div
                  className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
                  key={trailer.id}
                >
                  <div className="relative aspect-video w-full">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      src={trailer.embedUrl}
                      title={`${trailer.title} trailer`}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      {trailer.category}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#f6e6c8]">
                      {trailer.title}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {trailer.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#f6e6c8] pixel-text-shadow">
                Series & TV picks
              </h2>
              <span className="text-xs font-semibold text-white/60">
                Originals + limited runs
              </span>
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {seriesPicks.map((item) => (
                <MediaPickCard item={item} key={item.id} />
              ))}
            </div>
          </section>

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
