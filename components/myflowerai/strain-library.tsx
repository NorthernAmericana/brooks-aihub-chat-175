"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AgeGate } from "@/components/myflowerai/aura/age-gate";

export type StrainListItem = {
  id: string;
  name: string;
  type?: string;
  brand?: string;
  description: string;
};

type StrainLibraryProps = {
  strains: StrainListItem[];
};

const DESCRIPTION_FALLBACK = "Description coming soon.";

const formatTypeLabel = (type?: string) => {
  if (!type) {
    return "Unknown";
  }

  const firstLetter = type.at(0);
  if (!firstLetter) {
    return type;
  }

  return `${firstLetter.toUpperCase()}${type.slice(1)}`;
};

export function StrainLibrary({ strains }: StrainLibraryProps) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredStrains = useMemo(() => {
    if (!normalizedQuery) {
      return strains;
    }

    return strains.filter((strain) => {
      const searchText = [
        strain.name,
        strain.brand,
        strain.type,
        strain.description,
      ]
        .filter((value) => value)
        .join(" ")
        .toLowerCase();
      return searchText.includes(normalizedQuery);
    });
  }, [normalizedQuery, strains]);

  return (
    <>
      <AgeGate onVerified={() => setAgeVerified(true)} />
      {ageVerified && (
        <div className="h-dvh overflow-y-auto overscroll-behavior-contain -webkit-overflow-scrolling-touch">
          <div className="mx-auto w-full max-w-5xl px-4 py-6">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white/70 p-4 backdrop-blur-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  MyFlowerAI
                </p>
                <h1 className="text-lg font-semibold text-black">
                  Strain library
                </h1>
                <p className="text-xs text-black/60">
                  Search every strain indexed from the repository catalog.
                </p>
              </div>
              <Link
                className="rounded-full bg-black/5 px-4 py-2 text-xs font-semibold text-black/70 transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                href="/MyFlowerAI"
              >
                Back to dashboard
              </Link>
            </header>

            <section className="mt-6 rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-black">
                    Browse strains
                  </h2>
                  <p className="text-xs text-black/60">
                    Filter by name, brand, type, or notes.
                  </p>
                </div>
                <div className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/60">
                  {filteredStrains.length} of {strains.length} strains
                </div>
              </div>

              <div className="mt-4">
                <label className="sr-only" htmlFor="strain-search">
                  Search strains
                </label>
                <input
                  autoComplete="off"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  id="strain-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search strains, brands, or effects..."
                  type="search"
                  value={query}
                />
                <p className="mt-2 text-xs text-black/50">
                  Showing strains available to the MyFlowerAI agent.
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {filteredStrains.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/20 bg-white/70 p-6 text-center text-sm text-black/60">
                    No strains match that search yet. Try a different keyword.
                  </div>
                ) : (
                  filteredStrains.map((strain) => {
                    const description =
                      strain.description.trim().length > 0
                        ? strain.description
                        : DESCRIPTION_FALLBACK;
                    const preview =
                      description.length > 160
                        ? `${description.slice(0, 160)}...`
                        : description;

                    return (
                      <article
                        className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm"
                        key={strain.id}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-xs font-semibold text-pink-700">
                            SF
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-black">
                                {strain.name}
                              </h3>
                              <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/60">
                                {formatTypeLabel(strain.type)}
                              </span>
                            </div>
                            <p className="text-xs text-black/60">
                              {strain.brand ?? "Brand details coming soon."}
                            </p>
                            <p className="text-xs text-black/70">{preview}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
