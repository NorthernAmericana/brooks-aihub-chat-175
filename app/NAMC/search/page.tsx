"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const sampleResults = [
  { id: "res-ghost-girl", title: "Ghost Girl", subtitle: "Project • Lore + game" },
  { id: "res-mdd", title: "My Daughter, Death", subtitle: "Project • Game details" },
  { id: "res-timeline", title: "Timeline master", subtitle: "Lore • Chronology" },
  { id: "res-motifs", title: "Motifs", subtitle: "Lore • Themes and symbols" },
] as const;

export default function NamcSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sampleResults;
    }
    return sampleResults.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(normalized)
    );
  }, [query]);

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
              <Search className="h-5 w-5 text-white/80" />
              <h1 className="font-pixel text-lg text-[#f6e6c8]">Search</h1>
            </div>
          </div>
          <Link
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
            href="/NAMC"
          >
            Home
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <label className="sr-only" htmlFor="namc-search-input">
              Search NAMC
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <input
                className="w-full rounded-2xl border border-white/15 bg-black/30 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/55 focus:border-white/30 focus:bg-black/40 focus:outline-none"
                id="namc-search-input"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, lore, playlists…"
                type="search"
                value={query}
              />
            </div>

            <div className="mt-6 space-y-3">
              {results.map((item) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  key={item.id}
                >
                  <p className="text-sm font-semibold text-[#f6e6c8]">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/65">{item.subtitle}</p>
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-sm text-white/65">No results found.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
