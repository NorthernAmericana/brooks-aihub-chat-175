"use client";

import {
  CircleUserRound,
  Flame,
  Home,
  Library,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NAMC_TRAILERS } from "@/lib/namc-trailers";

type NamcCardKind = "video" | "game" | "album" | "lore";

type NamcCard = {
  id: string;
  title: string;
  subtitle: string;
  kind: NamcCardKind;
  badge?: string;
  durationLabel?: string;
  metricLabel?: string;
};

type GalleryKind = "video" | "photo";

type GalleryItem = {
  id: string;
  title: string;
  description: string;
  kind: GalleryKind;
  badge?: string;
};

const spotlightBadges = [
  "Combo Pack",
  "Game Early Access",
  "Full Novel Early 2027",
] as const;

const spotlightLinks = [
  {
    id: "spotlight-steam",
    label: "Steam Early Access",
    href: "https://store.steampowered.com/",
  },
  {
    id: "spotlight-itch",
    label: "Itch.io Early Access",
    href: "https://itch.io/",
  },
  {
    id: "spotlight-novel",
    label: "Novel preorder (placeholder)",
    href: "https://example.com/my-daughter-death-novel",
  },
] as const;

const collections: NamcCard[] = [
  {
    id: "collection-cabin",
    title: "Cabin Vibes",
    subtitle: "Playlist",
    kind: "album",
    badge: "Cozy",
  },
  {
    id: "collection-mountain",
    title: "Mountain Melodies",
    subtitle: "Playlist",
    kind: "album",
    badge: "New",
  },
  {
    id: "collection-load",
    title: "Load Playlist",
    subtitle: "Shortcut",
    kind: "album",
  },
  {
    id: "collection-enter",
    title: "Enter a Story",
    subtitle: "Lore shelf",
    kind: "lore",
  },
] as const;

const trending: NamcCard[] = [
  {
    id: "trend-indie-docs",
    title: "Indie Docs: The Crafted Life",
    subtitle: "Documentary",
    kind: "video",
    durationLabel: "10:53",
    metricLabel: "5.9K views",
  },
  {
    id: "trend-live-barn",
    title: "Live from the Barn",
    subtitle: "Session",
    kind: "video",
    durationLabel: "10:52",
    metricLabel: "107K views",
  },
  {
    id: "trend-dank-time",
    title: "The Dank Time",
    subtitle: "Series",
    kind: "video",
    durationLabel: "12:08",
    metricLabel: "101K views",
  },
] as const;

const newGames: NamcCard[] = [
  {
    id: "game-ghost-girl",
    title: "Ghost Girl",
    subtitle: "Interactive story",
    kind: "game",
    badge: "Coming soon",
    metricLabel: "Prototype build",
  },
  {
    id: "game-my-daughter-death",
    title: "My Daughter, Death: Frostbitten",
    subtitle: "Narrative game",
    kind: "game",
    badge: "Early access",
    metricLabel: "Full novel early 2027",
  },
  {
    id: "game-night-drive",
    title: "Night Drive Notes",
    subtitle: "Ambient exploration",
    kind: "game",
    badge: "Wishlist",
    metricLabel: "Playable demo",
  },
] as const;

const conceptTrailers = NAMC_TRAILERS;

const gameGallery: GalleryItem[] = [
  {
    id: "game-gallery-teaser",
    title: "Frostbitten early access teaser",
    description: "Gameplay vibe reel",
    kind: "video",
  },
  {
    id: "game-gallery-trailer",
    title: "Whiteout survival trailer",
    description: "Story beats preview",
    kind: "video",
    badge: "New",
  },
  {
    id: "game-gallery-cabin",
    title: "Cabin in the drift",
    description: "Environment concept",
    kind: "photo",
  },
  {
    id: "game-gallery-forest",
    title: "Northwood trail",
    description: "Atmospheric still",
    kind: "photo",
  },
] as const;

const novelGallery: GalleryItem[] = [
  {
    id: "novel-gallery-reading",
    title: "Opening chapter reading",
    description: "Audio + video tease",
    kind: "video",
  },
  {
    id: "novel-gallery-cover",
    title: "Frostbitten cover study",
    description: "Alternate jacket draft",
    kind: "photo",
    badge: "Preview",
  },
  {
    id: "novel-gallery-notes",
    title: "Field journal inserts",
    description: "Layout mockup",
    kind: "photo",
  },
  {
    id: "novel-gallery-mood",
    title: "Mood reel",
    description: "Ambient score montage",
    kind: "video",
  },
] as const;

const kindLabel: Record<NamcCardKind, string> = {
  video: "Video",
  game: "Game",
  album: "Playlist",
  lore: "Lore",
} as const;

const matchesQuery = (query: string, item: NamcCard) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return `${item.title} ${item.subtitle} ${kindLabel[item.kind]}`
    .toLowerCase()
    .includes(normalized);
};

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold text-[#f6e6c8] pixel-text-shadow">
        {title}
      </h2>
      <Link
        className="text-xs font-semibold text-[#f6e6c8]/80 transition hover:text-[#f6e6c8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
        href={href}
      >
        Show all
      </Link>
    </div>
  );
}

function CardBase({
  item,
  variant,
}: {
  item: NamcCard;
  variant: "tile" | "thumb";
}) {
  const badge = item.badge;
  const duration = item.durationLabel;
  const metric = item.metricLabel;

  const bg =
    item.kind === "album"
      ? "bg-[radial-gradient(circle_at_25%_15%,rgba(255,215,140,0.35),transparent_55%),linear-gradient(135deg,rgba(115,74,42,0.95),rgba(40,24,15,0.92))]"
      : item.kind === "game"
        ? "bg-[radial-gradient(circle_at_20%_20%,rgba(120,198,255,0.30),transparent_55%),linear-gradient(135deg,rgba(35,48,64,0.92),rgba(12,18,28,0.92))]"
        : item.kind === "lore"
          ? "bg-[radial-gradient(circle_at_30%_20%,rgba(255,165,126,0.25),transparent_55%),linear-gradient(135deg,rgba(60,32,26,0.92),rgba(20,12,14,0.92))]"
          : "bg-[radial-gradient(circle_at_20%_15%,rgba(255,236,196,0.22),transparent_55%),linear-gradient(135deg,rgba(64,40,28,0.90),rgba(20,13,18,0.92))]";

  if (variant === "tile") {
    return (
      <div className="relative h-[88px] w-[124px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:h-[92px] sm:w-[132px]">
        <div className={`absolute inset-0 ${bg}`} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.75))]" />
        {badge && (
          <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm">
            {badge}
          </div>
        )}
        <div className="relative z-10 flex h-full flex-col justify-end p-3">
          <p className="text-sm font-semibold text-[#f6e6c8]">{item.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative w-[210px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:w-[240px]">
      <div className={`absolute inset-0 ${bg}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.82))]" />
      <div className="relative z-10 flex aspect-[16/9] items-end p-3">
        <div className="flex w-full items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#f6e6c8]">
              {item.title}
            </p>
            <p className="truncate text-xs text-[#f6e6c8]/75">{metric ?? item.subtitle}</p>
          </div>
          {duration && (
            <div className="rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
              {duration}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-white/5" />
      </div>
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const accent =
    item.kind === "video"
      ? "bg-[radial-gradient(circle_at_20%_20%,rgba(121,198,255,0.35),transparent_55%),linear-gradient(135deg,rgba(20,32,48,0.95),rgba(12,18,28,0.95))]"
      : "bg-[radial-gradient(circle_at_20%_20%,rgba(255,209,140,0.28),transparent_55%),linear-gradient(135deg,rgba(56,38,26,0.95),rgba(20,14,18,0.95))]";

  return (
    <div className="group relative h-[160px] w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:h-[176px] sm:w-[260px]">
      <div className={`absolute inset-0 ${accent}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.82))]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
          <span>{item.kind === "video" ? "Video" : "Photo"}</span>
          {item.badge && (
            <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] text-white/80">
              {item.badge}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f6e6c8]">{item.title}</p>
          <p className="mt-1 text-xs text-white/70">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

function TrailerCard({
  trailer,
}: {
  trailer: (typeof conceptTrailers)[number];
}) {
  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:w-[320px]">
      <div className="relative aspect-video w-full">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          src={trailer.embedUrl}
          title={`${trailer.title} trailer`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {trailer.category}
        </span>
        <div>
          <p className="text-sm font-semibold text-[#f6e6c8]">
            {trailer.title}
          </p>
          <p className="text-xs text-white/70">{trailer.subtitle}</p>
        </div>
        <Link
          className="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f6e6c8] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
          href={{
            pathname: "/NAMC/library/trailers",
            query: { trailer: trailer.id },
          }}
        >
          Open player
        </Link>
      </div>
    </div>
  );
}

export default function NamcHomePage() {
  const [query, setQuery] = useState("");

  const filteredCollections = useMemo(
    () => collections.filter((item) => matchesQuery(query, item)),
    [query]
  );
  const filteredTrending = useMemo(
    () => trending.filter((item) => matchesQuery(query, item)),
    [query]
  );
  const filteredGames = useMemo(
    () => newGames.filter((item) => matchesQuery(query, item)),
    [query]
  );

  return (
    <div className="fixed inset-0 z-50 woodsy-base soft-vignette">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,236,196,0.20),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,4,0.15),rgba(10,6,4,0.72))]" />

      <div className="relative flex h-dvh flex-col text-white">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <Link
              className="font-pixel text-xl text-[#f6e6c8] pixel-text-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC"
            >
              /NAMC/
            </Link>

            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="relative hidden w-full max-w-xl md:block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                <label className="sr-only" htmlFor="namc-search">
                  Search NAMC
                </label>
                <input
                  className="w-full rounded-full border border-white/15 bg-black/30 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/55 focus:border-white/30 focus:bg-black/40 focus:outline-none"
                  id="namc-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects, playlists, lore…"
                  type="search"
                  value={query}
                />
              </div>
              <button
                aria-label="Open profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                type="button"
              >
                <CircleUserRound className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 pb-32 pt-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain sm:px-6">
          <div className="mb-5 md:hidden">
            <label className="sr-only" htmlFor="namc-search-mobile">
              Search NAMC
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <input
                className="w-full rounded-full border border-white/15 bg-black/30 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/55 focus:border-white/30 focus:bg-black/40 focus:outline-none"
                id="namc-search-mobile"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, playlists, lore…"
                type="search"
                value={query}
              />
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,215,140,0.20),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.82))]" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/65">
                  Spotlight
                </p>
                <h1 className="mt-3 text-3xl font-bold text-[#f6e6c8] pixel-text-shadow">
                  My Daughter, Death: Frostbitten
                </h1>
                <p className="mt-2 text-sm text-white/75">
                  Combo pack spotlight with the video game early access and the
                  full novel release arriving in early 2027.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {spotlightBadges.map((badge) => (
                    <span
                      className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80"
                      key={badge}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <details className="group mt-5 overflow-hidden rounded-2xl border border-white/15 bg-black/35">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40">
                    Open combo pack links
                    <span className="text-xs text-white/60 group-open:hidden">
                      Tap to view
                    </span>
                    <span className="hidden text-xs text-white/60 group-open:inline">
                      Tap to close
                    </span>
                  </summary>
                  <div className="border-t border-white/10 p-4">
                    <div className="grid gap-2">
                      {spotlightLinks.map((link) => (
                        <Link
                          className="flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                          href={link.href}
                          key={link.id}
                        >
                          <span>{link.label}</span>
                          <span className="text-xs text-white/60">Open</span>
                        </Link>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-white/60">
                      Novel preorder link is a placeholder until the storefront
                      goes live.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
                <SectionHeader href="/NAMC/library" title="Your Collection" />
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
                  {filteredCollections.map((item) => (
                    <Link
                      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                      href="/NAMC/library"
                      key={item.id}
                    >
                      <CardBase item={item} variant="tile" />
                    </Link>
                  ))}
                  {filteredCollections.length === 0 && (
                    <div className="flex items-center text-sm text-white/65">
                      No matches in your collection.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
                <SectionHeader href="/NAMC/library" title="Trending Now" />
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
                  {filteredTrending.map((item) => (
                    <Link
                      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                      href="/NAMC/library"
                      key={item.id}
                    >
                      <CardBase item={item} variant="thumb" />
                    </Link>
                  ))}
                  {filteredTrending.length === 0 && (
                    <div className="flex items-center text-sm text-white/65">
                      No trending matches.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
            <SectionHeader href="/NAMC/library" title="Games & Interactive" />
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {filteredGames.map((item) => (
                <Link
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                  href="/NAMC/library"
                  key={item.id}
                >
                  <CardBase item={item} variant="thumb" />
                </Link>
              ))}
              {filteredGames.length === 0 && (
                <div className="flex items-center text-sm text-white/65">
                  No game matches.
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#f6e6c8] pixel-text-shadow">
                Concept Trailers
              </h2>
              <Link
                className="text-xs font-semibold text-[#f6e6c8]/80 transition hover:text-[#f6e6c8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                href="/NAMC/library/trailers"
              >
                Open player
              </Link>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Stream the My Daughter, Death concept trailers right from the
              NAMC home screen.
            </p>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {conceptTrailers.map((trailer) => (
                <TrailerCard key={trailer.id} trailer={trailer} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#f6e6c8] pixel-text-shadow">
                Frostbitten Game Gallery
              </h2>
              <span className="text-xs font-semibold text-white/60">
                Videos + Photos
              </span>
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {gameGallery.map((item) => (
                <GalleryCard item={item} key={item.id} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-md">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#f6e6c8] pixel-text-shadow">
                Frostbitten Novel Gallery
              </h2>
              <span className="text-xs font-semibold text-white/60">
                Videos + Photos
              </span>
            </div>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch">
              {novelGallery.map((item) => (
                <GalleryCard item={item} key={item.id} />
              ))}
            </div>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/35 backdrop-blur-md">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-5 gap-2 px-4 py-3">
            <Link
              aria-label="Home"
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/90 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC"
            >
              <Home className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Home</span>
            </Link>
            <Link
              aria-label="Search"
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC/search"
            >
              <Search className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Search</span>
            </Link>
            <Link
              aria-label="Create"
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC/library"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Add</span>
            </Link>
            <Link
              aria-label="Library"
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC/library"
            >
              <Library className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Library</span>
            </Link>
            <Link
              aria-label="Campfire"
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-white/70 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC/campfire"
            >
              <Flame className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Campfire</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
