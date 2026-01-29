"use client";

import {
  ArrowLeft,
  Check,
  Compass,
  Download,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TownSummary = {
  id: string;
  city: string;
  subAreas: string[];
  vibes: string[];
  anchors: string[];
  communityVibe?: string;
};

type TownResponse = {
  count: number;
  towns: TownSummary[];
};

const MAP_PIN_POSITIONS = [
  "top-8 left-12",
  "top-16 right-16",
  "bottom-16 left-20",
  "bottom-20 right-24",
  "top-24 left-1/2",
] as const;

const INSTALL_STORAGE_KEY = "ato-app-installed:mycarmindato";

const normalizeQueryValue = (value: string) => value.trim().toLowerCase();

const truncateText = (text: string, maxLength = 140) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;

export default function MyCarMindATOAppPage() {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasHydratedInstallState, setHasHydratedInstallState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [towns, setTowns] = useState<TownSummary[]>([]);
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(INSTALL_STORAGE_KEY);
    setIsInstalled(storedValue === "true");
    setHasHydratedInstallState(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedInstallState || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(INSTALL_STORAGE_KEY, String(isInstalled));
  }, [hasHydratedInstallState, isInstalled]);

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
    const prompt = queryText
      ? `/MyCarMindATO/ Plan a route to ${queryText}`
      : "/MyCarMindATO/";
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
  };

  const handleTownSelect = (town: TownSummary) => {
    setSelectedTownId(town.id);
    setSearchQuery(town.city);
  };

  const handleInstallClick = () => {
    if (!isInstalled) {
      setIsInstalled(true);
    }
  };

  const handleGoToApp = () => {
    const prompt = "/MyCarMindATO/";
    router.push(`/brooks-ai-hub?query=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0d1620] via-[#0f1c27] to-[#0b151d]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#0b151d]/90 px-4 py-3 backdrop-blur-sm">
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
            <p className="text-xs text-white/60">Destination intelligence</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt="MyCarMindATO icon"
                  className="h-full w-full object-cover"
                  height={64}
                  src="/icons/mycarmindato-appicon.png"
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">MyCarMindATO</h2>
                <p className="text-sm text-white/60">Utilities - 13+</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>Rating 4.7</span>
                  <span>5K+ downloads</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <button
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isInstalled
                    ? "bg-emerald-600/80 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                disabled={isInstalled}
                onClick={handleInstallClick}
                type="button"
              >
                {isInstalled ? (
                  <>
                    <Check className="h-4 w-4" />
                    Installed
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install
                  </>
                )}
              </button>

              {isInstalled && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                  onClick={handleGoToApp}
                  type="button"
                >
                  Go to ATO app
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Mapbox layout preview
              </p>
              <h2 className="text-xl font-semibold text-white">
                Town discovery map
              </h2>
              <p className="text-sm text-white/60">
                Visualize missions, mastery, and new towns from the MyCarMindATO
                agent route.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              onClick={() => handleAskAgent(selectedTown?.city)}
              type="button"
            >
              <Navigation className="h-4 w-4" />
              Ask MyCarMindATO
            </button>
          </div>

          <div className="mt-5">
            <div className="relative aspect-[16/10] min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b1f2a] shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,140,220,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(74,191,159,0.25),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.3),rgba(5,15,24,0.9))]" />

              <div className="relative z-10 h-full p-6">
                <div className="flex items-center justify-between text-white">
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
                        className={`absolute ${position} flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white/90 shadow-lg backdrop-blur-sm transition hover:bg-black/70`}
                        key={town.id}
                        onClick={() => handleTownSelect(town)}
                        type="button"
                      >
                        <MapPin className="h-3 w-3 text-emerald-300" />
                        {town.city.split(",").at(0) ?? town.city}
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

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/50 p-4 text-white shadow-lg backdrop-blur-md">
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

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">About</h3>
          <p className="mt-2 text-sm text-white/70">
            MyCarMindATO is your travel companion for discovering towns, logging
            missions, and navigating routes across the Brooks AI HUB. It keeps
            your destination mastery, local tips, and travel stats synced with
            the MyCarMindATO agent.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Routes in Brooks AI HUB
          </h3>
          <div className="mt-3 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono">/MyCarMindATO/</span>
              <span className="text-xs text-white/50">
                Main travel intelligence route
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="font-mono">/MyCarMindATO/Driver/</span>
              <span className="text-xs text-white/50">Personal car owners</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="font-mono">/MyCarMindATO/Trucker/</span>
              <span className="text-xs text-white/50">Commercial truckers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono">/MyCarMindATO/DeliveryDriver/</span>
              <span className="text-xs text-white/50">Delivery and gig drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="font-mono">/MyCarMindATO/Traveler/</span>
              <span className="text-xs text-white/50">Road trip explorers</span>
            </div>
          </div>
        </section>

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
                <p className="mt-1 text-xs text-white/60">{mission.detail}</p>
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
      </div>
    </div>
  );
}
