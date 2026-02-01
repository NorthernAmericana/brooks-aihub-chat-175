"use client";

import {
  ArrowLeft,
  Compass,
  MapPin,
  Navigation,
  Search,
  Square,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import MapView from "@/components/mycarmindato/map-view";

type TownSummary = {
  id: string;
  city: string;
  cityName: string;
  stateName: string;
  subAreas: string[];
  vibes: string[];
  anchors: string[];
  communityVibe?: string;
};

type TownGroup = {
  stateName: string;
  towns: TownSummary[];
};

type TownResponse = {
  count: number;
  towns: TownSummary[];
  groupedTowns: TownGroup[];
};

const MAP_PIN_POSITIONS = [
  "top-8 left-12",
  "top-16 right-16",
  "bottom-16 left-20",
  "bottom-20 right-24",
  "top-24 left-1/2",
] as const;

const normalizeQueryValue = (value: string) => value.trim().toLowerCase();

const truncateText = (text: string, maxLength = 140) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;

const buildMapSearchUrl = (query: string) =>
  `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;

export default function MyCarMindATOPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [towns, setTowns] = useState<TownSummary[]>([]);
  const [townGroups, setTownGroups] = useState<TownGroup[]>([]);
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapOnly, setIsMapOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "dictionary">("map");

  useEffect(() => {
    const controller = new AbortController();

    const loadTowns = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/mycarmindato/towns", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load towns.");
        }
        const data = (await response.json()) as TownResponse;
        setTowns(data.towns);
        setTownGroups(data.groupedTowns);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Unable to load towns."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadTowns();

    return () => controller.abort();
  }, []);

  const filteredTowns = useMemo(() => {
    const normalizedQuery = normalizeQueryValue(searchQuery);
    if (!normalizedQuery) {
      return towns.slice(0, 10);
    }

    return towns
      .filter((town) => {
        const haystack = [
          town.city,
          town.cityName,
          town.stateName,
          ...town.subAreas,
          ...town.vibes,
          ...town.anchors,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 12);
  }, [searchQuery, towns]);

  const filteredTownGroups = useMemo(() => {
    const normalizedQuery = normalizeQueryValue(searchQuery);
    if (!normalizedQuery) {
      return townGroups;
    }

    return townGroups
      .map((group) => {
        const matchingTowns = group.towns.filter((town) => {
          const haystack = [
            town.city,
            town.cityName,
            town.stateName,
            ...town.subAreas,
            ...town.vibes,
            ...town.anchors,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        });
        return matchingTowns.length > 0
          ? { ...group, towns: matchingTowns }
          : null;
      })
      .filter((group): group is TownGroup => Boolean(group));
  }, [searchQuery, townGroups]);

  const selectedTown = useMemo(
    () => towns.find((town) => town.id === selectedTownId),
    [selectedTownId, towns]
  );

  const pinnedTowns = useMemo(
    () => filteredTowns.slice(0, MAP_PIN_POSITIONS.length),
    [filteredTowns]
  );

  const handleAskAgent = (destination?: string) => {
    const queryText = destination?.trim() || searchQuery.trim();
    if (!queryText) {
      router.push("/brooks-ai-hub");
      return;
    }
    const prompt = `/MyCarMindATO/ Plan a route to ${queryText}`;
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
  };

  const handleTownSelect = (town: TownSummary) => {
    setSelectedTownId(town.id);
    setSearchQuery(town.city);
  };

  const mapQuery = selectedTown?.city || searchQuery.trim() || "United States";
  const mapSearchUrl = buildMapSearchUrl(mapQuery);

  const handleTabChange = (tab: "map" | "dictionary") => {
    setActiveTab(tab);
    if (tab !== "map") {
      setIsMapOnly(false);
    }
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0d1620] via-[#0f1c27] to-[#0b151d]">
      <div className="app-page-header sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0b151d]/90 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt="MyCarMindATO icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/mycarmindato-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">MyCarMindATO</h1>
            <p className="text-xs text-white/60">Live map experience</p>
          </div>
        </div>
        {activeTab === "map" && (
          <button
            aria-pressed={isMapOnly}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            onClick={() => setIsMapOnly((current) => !current)}
            type="button"
          >
            <Square className="h-4 w-4" />
            <span>{isMapOnly ? "Exit map only" : "Map only"}</span>
            <span className="sr-only">
              {isMapOnly
                ? "Disable map only mode"
                : "Enable map only mode to focus on the map"}
            </span>
          </button>
        )}
      </div>

      <div
        className={`app-page-content flex-1 ${
          isMapOnly && activeTab === "map"
            ? "flex flex-col overflow-hidden px-0 py-0"
            : "space-y-6 overflow-y-auto px-4 py-6"
        }`}
      >
        {!isMapOnly && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              {(
                [
                  { key: "map", label: "Map" },
                  { key: "dictionary", label: "Location Dictionary" },
                ] as const
              ).map((tab) => (
                <button
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    activeTab === tab.key
                      ? "bg-emerald-400 text-[#0b151d]"
                      : "text-white/70 hover:text-white"
                  }`}
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-white/50">
              {activeTab === "map"
                ? "Live map with pins and routing."
                : "Browse towns grouped by state."}
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <section
            className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm ${
              isMapOnly ? "flex h-full flex-col" : "p-5"
            }`}
          >
            {!isMapOnly && (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Mapbox-style layout
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Town discovery map
                  </h2>
                  <p className="text-sm text-white/60">
                    Explore destinations and route them to the MyCarMindATO
                    agent.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    onClick={() => handleAskAgent(selectedTown?.city)}
                    type="button"
                  >
                    <Navigation className="h-4 w-4" />
                    Ask MyCarMindATO
                  </button>
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    href={mapSearchUrl}
                    rel="noopener"
                    target="_blank"
                  >
                    Open in maps
                  </a>
                </div>
              </div>
            )}

            <div className={isMapOnly ? "flex-1 p-4" : "mt-5"}>
              <div className="relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b1f2a] shadow-xl">
                <MapView
                  ariaLabel="MyCarMindATO map"
                  className="absolute inset-0 h-full w-full"
                  containerClassName="absolute inset-0"
                  query={mapQuery}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.1),rgba(5,15,24,0.75))] pointer-events-none" />

                <div className="absolute inset-0 z-10 p-6 pointer-events-none">
                  <div className="flex items-center justify-between text-white pointer-events-auto">
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                      Live map
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Compass className="h-4 w-4" />
                      Towns indexed: {towns.length}
                    </div>
                  </div>

                  <div className="absolute inset-0">
                    {pinnedTowns.map((town, index) => {
                      const position = MAP_PIN_POSITIONS.at(index);
                      if (!position) {
                        return null;
                      }
                      return (
                        <button
                          aria-label={`Select ${town.city}`}
                          className={`absolute ${position} pointer-events-auto flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white/90 shadow-lg backdrop-blur-sm transition hover:bg-black/70`}
                          key={town.id}
                          onClick={() => handleTownSelect(town)}
                          type="button"
                        >
                          <MapPin className="h-3 w-3 text-emerald-300" />
                          {town.cityName}
                        </button>
                      );
                    })}
                    {pinnedTowns.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                        {isLoading
                          ? "Loading towns..."
                          : "Town data is still syncing."}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/50 p-4 text-white shadow-lg backdrop-blur-md pointer-events-auto">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Active destination
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {selectedTown?.city || "Select a town to preview"}
                        </p>
                        <p className="text-xs text-white/60">
                          {selectedTown?.communityVibe
                            ? truncateText(selectedTown.communityVibe, 120)
                            : "Search or tap a town pin to get started."}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                        onClick={() => handleAskAgent(selectedTown?.city)}
                        type="button"
                      >
                        Route
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "map" && !isMapOnly && (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Destination search
                  </h3>
                  <p className="text-sm text-white/60">
                    Search towns from the MyCarMindATO discovery index.
                  </p>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {isLoading ? "Loading..." : `${towns.length} towns loaded`}
                </div>
              </div>

              <div className="mt-4">
                <label className="sr-only" htmlFor="town-search">
                  Search towns
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                    id="town-search"
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSelectedTownId(null);
                    }}
                    placeholder="Search for a town or landmark"
                    type="text"
                    value={searchQuery}
                  />
                </div>
              </div>

              {loadError && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {loadError}
                </div>
              )}

              {!loadError && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {filteredTowns.map((town) => (
                    <div
                      className={`rounded-2xl border p-4 transition ${
                        selectedTownId === town.id
                          ? "border-emerald-400/60 bg-emerald-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                      key={town.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {town.city}
                          </p>
                          <p className="text-xs text-white/60">
                            {town.subAreas.slice(0, 2).join(", ") ||
                              "Town profile available"}
                          </p>
                        </div>
                        <button
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                          onClick={() => handleTownSelect(town)}
                          type="button"
                        >
                          Preview
                        </button>
                      </div>

                      {town.vibes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {town.vibes.slice(0, 3).map((vibe) => (
                            <span
                              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                              key={`${town.id}-${vibe}`}
                            >
                              {vibe}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-white/50">
                          {town.anchors.at(0) ||
                            "Known for immersive travel missions"}
                        </div>
                        <button
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
                          onClick={() => handleAskAgent(town.city)}
                          type="button"
                        >
                          <Navigation className="h-3 w-3" />
                          Route
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Missions and mastery
                  </h3>
                  <p className="text-sm text-white/60">
                    Syncs with MyCarMindATO town discovery progress.
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                  onClick={() => handleAskAgent(selectedTown?.city)}
                  type="button"
                >
                  <Navigation className="h-4 w-4" />
                  Start mission
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: "Weekly mission",
                    detail: "Explore 3 new points of interest",
                    progress: 0.62,
                  },
                  {
                    title: "Town mastery",
                    detail: "8 towns at 60% completion",
                    progress: 0.6,
                  },
                  {
                    title: "Review streak",
                    detail: "4 days of new destination notes",
                    progress: 0.4,
                  },
                ].map((mission) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    key={mission.title}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {mission.title}
                      </p>
                      <span className="text-xs text-white/50">
                        {Math.round(mission.progress * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/60">
                      {mission.detail}
                    </p>
                    <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${mission.progress * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "dictionary" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Location dictionary
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Towns grouped by state
                </h2>
                <p className="text-sm text-white/60">
                  Search within state lists while keeping the canonical order.
                </p>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                {isLoading ? "Loading..." : `${towns.length} towns indexed`}
              </div>
            </div>

            <div className="mt-4">
              <label className="sr-only" htmlFor="town-dictionary-search">
                Search location dictionary
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                  id="town-dictionary-search"
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSelectedTownId(null);
                  }}
                  placeholder="Search towns, vibes, or anchors"
                  type="text"
                  value={searchQuery}
                />
              </div>
            </div>

            {loadError && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            {!loadError && (
              <div className="mt-5 max-h-[540px] overflow-y-auto rounded-2xl border border-white/10 bg-black/30">
                {filteredTownGroups.length === 0 && (
                  <div className="p-6 text-sm text-white/60">
                    {isLoading
                      ? "Loading towns..."
                      : "No towns match your search yet."}
                  </div>
                )}
                <div className="divide-y divide-white/10">
                  {filteredTownGroups.map((group) => (
                    <div key={group.stateName}>
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b151d]/90 px-4 py-2 backdrop-blur-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                            {group.stateName}
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {group.towns.length} towns
                          </p>
                        </div>
                        <button
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                          onClick={() => handleAskAgent(group.stateName)}
                          type="button"
                        >
                          Plan in {group.stateName}
                        </button>
                      </div>
                      <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                        {group.towns.map((town) => (
                          <div
                            className={`rounded-2xl border p-4 transition ${
                              selectedTownId === town.id
                                ? "border-emerald-400/60 bg-emerald-400/10"
                                : "border-white/10 bg-white/5"
                            }`}
                            key={town.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {town.cityName}
                                </p>
                                <p className="text-xs text-white/60">
                                  {town.stateName}
                                </p>
                              </div>
                              <button
                                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                                onClick={() => handleTownSelect(town)}
                                type="button"
                              >
                                Focus
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-white/60">
                              {town.subAreas.slice(0, 2).join(", ") ||
                                town.anchors.at(0) ||
                                "Town profile available"}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                                {town.vibes.at(0) || "MyCarMindATO catalog"}
                              </span>
                              <button
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
                                onClick={() => {
                                  handleTownSelect(town);
                                  handleTabChange("map");
                                }}
                                type="button"
                              >
                                <Navigation className="h-3 w-3" />
                                View map
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
