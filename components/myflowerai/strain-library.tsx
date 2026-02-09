"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AgeGate } from "@/components/myflowerai/aura/age-gate";

export type StrainListItem = {
  id: string;
  name: string;
  type?: string;
  brand?: string;
  aliases?: string[];
  description: string;
  thcRange?: string | null;
  cbdRange?: string | null;
  thcPercent?: number | null;
  terpenes?: string[];
  effects?: string[];
  sources?: Array<{
    type?: string;
    where?: string;
    url?: string | null;
  }>;
};

type StrainLibraryProps = {
  strains: StrainListItem[];
};

const DESCRIPTION_FALLBACK = "Description coming soon.";
const THC_RANGE_OPTIONS = [
  { id: "all", label: "All THC ranges" },
  { id: "low", label: "Low (under 15%)" },
  { id: "mid", label: "Mid (15-25%)" },
  { id: "high", label: "High (25%+)" },
  { id: "unknown", label: "Unknown THC" },
] as const;

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

const normalizeSearchText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const getThcBucket = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "unknown";
  }
  if (value < 15) {
    return "low";
  }
  if (value < 25) {
    return "mid";
  }
  return "high";
};

export function StrainLibrary({ strains }: StrainLibraryProps) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedThcRange, setSelectedThcRange] = useState("all");
  const [selectedStrain, setSelectedStrain] = useState<StrainListItem | null>(
    null
  );

  const normalizedQuery = query.trim().toLowerCase();

  const typeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(
        strains
          .map((strain) => strain.type?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );

    return uniqueTypes.sort((a, b) => a.localeCompare(b));
  }, [strains]);

  const filteredStrains = useMemo(() => {
    return strains.filter((strain) => {
      const searchValues = [
        strain.name,
        strain.brand,
        strain.type,
        strain.description,
        ...(strain.aliases ?? []),
        ...(strain.terpenes ?? []),
        ...(strain.effects ?? []),
      ]
        .filter((value) => value)
        .join(" ")
        .toLowerCase();

      const normalizedSearch = normalizeSearchText(searchValues);
      const normalizedQueryText = normalizeSearchText(normalizedQuery);
      const queryTokens = normalizedQueryText.split(" ").filter(Boolean);
      const compactSearch = normalizedSearch.replace(/\s+/g, "");
      const compactQuery = normalizedQueryText.replace(/\s+/g, "");

      const matchesQuery =
        !normalizedQuery ||
        normalizedSearch.includes(normalizedQueryText) ||
        (compactQuery.length > 0 && compactSearch.includes(compactQuery)) ||
        (queryTokens.length > 0 &&
          queryTokens.every((token) => normalizedSearch.includes(token)));

      const matchesType =
        selectedType === "all" ||
        strain.type?.toLowerCase() === selectedType;

      const matchesThc =
        selectedThcRange === "all" ||
        getThcBucket(strain.thcPercent) === selectedThcRange;

      return matchesQuery && matchesType && matchesThc;
    });
  }, [normalizedQuery, selectedThcRange, selectedType, strains]);

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
                    Filter by name, alias, type, or potency range.
                  </p>
                </div>
                <div className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/60">
                  {filteredStrains.length} of {strains.length} strains
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <label className="sr-only" htmlFor="strain-search">
                  Search strains
                </label>
                <input
                  autoComplete="off"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                  id="strain-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search strain names or aliases..."
                  type="search"
                  value={query}
                />
                <div>
                  <label
                    className="text-[11px] font-semibold uppercase tracking-wide text-black/40"
                    htmlFor="strain-type-filter"
                  >
                    Type
                  </label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                    id="strain-type-filter"
                    onChange={(event) => setSelectedType(event.target.value)}
                    value={selectedType}
                  >
                    <option value="all">All types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type.toLowerCase()}>
                        {formatTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="text-[11px] font-semibold uppercase tracking-wide text-black/40"
                    htmlFor="strain-thc-filter"
                  >
                    THC range
                  </label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                    id="strain-thc-filter"
                    onChange={(event) => setSelectedThcRange(event.target.value)}
                    value={selectedThcRange}
                  >
                    {THC_RANGE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-black/50">
                Showing strains available to the MyFlowerAI agent.
              </p>

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
                            <div className="flex flex-wrap items-center gap-2 text-xs text-black/60">
                              <span>
                                {strain.brand ?? "Brand details coming soon."}
                              </span>
                              <span className="text-black/30">•</span>
                              <span>
                                THC{" "}
                                {strain.thcRange ?? "range not available yet"}
                              </span>
                            </div>
                            <p className="text-xs text-black/70">{preview}</p>
                            <button
                              className="mt-2 inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold text-black/70 transition hover:border-black/20 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40"
                              onClick={() => setSelectedStrain(strain)}
                              type="button"
                            >
                              View details
                            </button>
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
      {ageVerified && selectedStrain && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                  Strain details
                </p>
                <h2 className="text-lg font-semibold text-black">
                  {selectedStrain.name}
                </h2>
                <p className="text-xs text-black/60">
                  {selectedStrain.brand ?? "Brand details coming soon."}
                </p>
              </div>
              <button
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60 transition hover:border-black/30 hover:bg-black/5"
                onClick={() => setSelectedStrain(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5 text-sm text-black/70">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">
                  {formatTypeLabel(selectedStrain.type)}
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">
                  THC {selectedStrain.thcRange ?? "N/A"}
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">
                  CBD {selectedStrain.cbdRange ?? "N/A"}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-black/40">
                  Description
                </h3>
                <p className="mt-2 text-sm text-black/70">
                  {selectedStrain.description.trim().length > 0
                    ? selectedStrain.description
                    : DESCRIPTION_FALLBACK}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-black/40">
                    Terpenes
                  </h3>
                  <p className="mt-2 text-sm text-black/70">
                    {selectedStrain.terpenes?.length
                      ? selectedStrain.terpenes.join(", ")
                      : "Terpene details coming soon."}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-black/40">
                    Effects
                  </h3>
                  <p className="mt-2 text-sm text-black/70">
                    {selectedStrain.effects?.length
                      ? selectedStrain.effects.join(", ")
                      : "Effects not listed yet."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-black/40">
                  Sources
                </h3>
                {selectedStrain.sources?.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-black/70">
                    {selectedStrain.sources.map((source, index) => (
                      <li key={`${source.where ?? "source"}-${index}`}>
                        <span className="font-semibold text-black/60">
                          {source.type ?? "source"}
                        </span>
                        {": "}
                        {source.url ? (
                          <Link
                            className="text-black underline decoration-black/40 underline-offset-4"
                            href={source.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {source.where ?? source.url}
                          </Link>
                        ) : (
                          <span>{source.where ?? "Details coming soon."}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-black/70">
                    Sources coming soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
