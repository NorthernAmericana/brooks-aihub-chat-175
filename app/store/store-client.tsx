"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import {
  HINT_LOCK_CLAIM_EVENT,
  hasActiveHintLock,
  type HintLockPayload,
} from "@/lib/hint-lock";
import type { StoreAppListItem } from "@/lib/store/listAppsWithInstallState";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const actionLabelForApp = (app: StoreAppListItem) => {
  if (app.slug === "namc") {
    return "Open NAMC PWA";
  }

  if (app.isInstalled && app.appPath) {
    return "Open";
  }
  return "View";
};

const namcStatusCopy = (app: StoreAppListItem) => {
  if (app.slug !== "namc") {
    return null;
  }

  if (app.isInstalled) {
    return "Device install verified recently via NAMC install gate flow.";
  }

  if (app.namcInstallGateCompleted) {
    return "Install gate route used. Device-level install could not be confirmed yet.";
  }

  return "Install gate route not used yet.";
};

type StoreClientProps = {
  apps: StoreAppListItem[];
  hasSession: boolean;
};

export function StoreClient({ apps, hasSession }: StoreClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"official" | "all">("all");
  const [isUnofficialShaking, setIsUnofficialShaking] = useState(false);
  const [showNorthernAmericanaHint, setShowNorthernAmericanaHint] =
    useState(false);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (hasActiveHintLock("store-northern-americana-hint")) {
      return;
    }

    setShowNorthernAmericanaHint(true);
    hintTimerRef.current = window.setTimeout(() => {
      setShowNorthernAmericanaHint(false);
      hintTimerRef.current = null;
    }, 2000);

    const handleHintClaim = (event: Event) => {
      const customEvent = event as CustomEvent<HintLockPayload>;
      if (customEvent.detail?.owner === "store-northern-americana-hint") {
        return;
      }

      setShowNorthernAmericanaHint(false);
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };

    window.addEventListener(HINT_LOCK_CLAIM_EVENT, handleHintClaim as EventListener);

    return () => {
      window.removeEventListener(
        HINT_LOCK_CLAIM_EVENT,
        handleHintClaim as EventListener,
      );

      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, []);

  const openNamcWebAppFromSwipe = () => {
    window.location.assign("https://www.northernamericana.media");
  };

  useSwipeGesture({
    edgeZone: 56,
    threshold: 90,
    onSwipeLeftFromRightEdge: openNamcWebAppFromSwipe,
    onSwipeRightFromLeftEdge: () => router.push("/brooks-ai-hub"),
  });

  const matchesSearchQuery = (app: StoreAppListItem, query: string) => {
    const searchableValues: Array<string> = [
      app.name,
      app.category ?? "",
      app.description ?? "",
      app.appPath ?? "",
      app.storePath ?? "",
    ];

    const routes = (app as { routes?: Array<string | Record<string, unknown>> }).routes;
    if (Array.isArray(routes)) {
      routes.forEach((route) => {
        if (typeof route === "string") {
          searchableValues.push(route);
          return;
        }
        if (route && typeof route === "object") {
          ["slash", "path", "route", "appPath", "storePath"].forEach((key) => {
            const value = route[key];
            if (typeof value === "string") {
              searchableValues.push(value);
            }
          });
        }
      });
    }

    return searchableValues.some((value) => value.toLowerCase().includes(query));
  };

  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const officialApps = apps.filter((app) => app.isOfficial);
    const sourceApps = filterMode === "official" ? officialApps : apps;

    if (!query) {
      return sourceApps;
    }

    return sourceApps.filter((app) => matchesSearchQuery(app, query));
  }, [apps, filterMode, searchQuery]);

  const handleOfficialPress = () => {
    setFilterMode("official");
  };

  const handleUnofficialPress = () => {
    setIsUnofficialShaking(true);
    toast("feature releasing soon");
    window.setTimeout(() => setIsUnofficialShaking(false), 450);
  };

  const hasSearchQuery = searchQuery.trim().length > 0;
  const isCatalogUnavailable = apps.length === 0;

  return (
    <div className="store-overlay fixed inset-0 z-50 flex flex-col overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        <div
          className={`absolute inset-y-0 right-0 w-[30vw] min-w-[220px] max-w-[380px] border-l border-white/10 bg-black/75 px-4 py-6 text-right text-white shadow-2xl backdrop-blur-md transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-opacity ${
            showNorthernAmericanaHint
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          }`}
          data-testid="northern-americana-hint"
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
            ATO Store Tip
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/95">
            Swipe left to open the NAMC web app. Install state only updates in /namc/install.
          </p>
        </div>
      </div>

      <button
        aria-label="Swipe right to go back to Brooks AI HUB"
        className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1 rounded-r-full border border-l-0 border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:flex"
        onClick={() => router.push("/brooks-ai-hub")}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Brooks AI HUB</span>
      </button>

      <button
        aria-label="Swipe left to go to Northern Americana Media"
        className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1 rounded-l-full border border-r-0 border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:flex"
        onClick={openNamcWebAppFromSwipe}
        type="button"
      >
        <span className="hidden sm:inline">Go to Northern Americana Media</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="store-header sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-screen-lg items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <button
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-pixel text-[clamp(28px,7vw,56px)] font-semibold leading-[0.9] text-slate-900 dark:text-slate-100 sm:leading-none">
            The Official ATO Store
          </h1>
        </div>
      </div>

      <div className="store-search">
        <div className="mx-auto w-full max-w-screen-lg px-4 py-4 sm:px-6 sm:py-6">
          <p className="mb-3 max-w-prose text-sm leading-snug text-slate-500 sm:text-base">
            ATOs stand for Autonomous Technological Operating Systems which power our AI Apps in Brooks AI HUB
          </p>
          <div className="relative mt-3 sm:mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label className="sr-only" htmlFor="store-search">
              Search apps
            </label>
            <input
              className="w-full max-w-none rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              id="store-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search apps"
              type="search"
              value={searchQuery}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filterMode === "official"
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={handleOfficialPress}
              type="button"
            >
              Official ATOs
            </button>
            <button
              className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 ${
                isUnofficialShaking
                  ? "[animation:store-unofficial-shake_0.45s_ease-in-out]"
                  : ""
              }`}
              onClick={handleUnofficialPress}
              type="button"
            >
              Unofficial ATOs
            </button>
          </div>
          {!hasSession && (
            <p className="mt-3 text-xs text-slate-500">
              Sign in to install and manage your ATO apps.
            </p>
          )}
        </div>
      </div>

      <div className="store-content flex-1 overflow-y-auto -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain pb-6">
        <div className="mx-auto w-full max-w-screen-lg px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredApps.map((app) => {
              const actionLabel = actionLabelForApp(app);
              const isNamc = app.slug === "namc";
              const targetPath = isNamc
                ? (app.storePath ?? app.appPath)
                : app.isInstalled
                  ? (app.appPath ?? app.storePath)
                  : (app.storePath ?? app.appPath);

              return (
                <button
                  className="store-app-card group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300 sm:px-5"
                  key={app.id}
                  onClick={() => {
                    if (targetPath) {
                      router.push(targetPath);
                    }
                  }}
                  type="button"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm sm:h-14 sm:w-14">
                        {app.iconUrl ? (
                          <ImageWithFallback
                            alt={`${app.name} icon`}
                            className="h-full w-full object-cover"
                            containerClassName="size-full"
                            height={56}
                            priority={false}
                            src={app.iconUrl}
                            width={56}
                          />
                        ) : (
                          <div className="text-xs text-slate-400">No icon</div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-slate-900">
                            {app.name}
                          </h3>
                          {app.isInstalled && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              Installed
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {app.category ?? "ATO"}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>{app.routeCount} routes</span>
                          {app.isOfficial && <span>Official</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center sm:self-center">
                      <span className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 shadow-sm transition group-hover:border-emerald-200 group-hover:bg-emerald-100 sm:w-auto">
                        <Download className="h-3.5 w-3.5" />
                        {actionLabel}
                      </span>
                    </div>
                  </div>

                  {app.description && (
                    <p className="mt-3 text-sm text-slate-600">
                      {app.description}
                    </p>
                  )}

                  {app.slug === "namc" && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <p className="font-medium">{namcStatusCopy(app)}</p>
                      {app.namcVerificationStatus !== "installed" && (
                        <p className="mt-1 text-amber-800/90">
                          Uninstall detection is approximate because browsers do not provide a
                          universal API for checking external PWA install state on every platform.
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}

            {filteredApps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {hasSearchQuery ? (
                  <p className="text-slate-500">No apps match your search.</p>
                ) : isCatalogUnavailable ? (
                  <p className="text-slate-500">
                    The app catalog is temporarily unavailable.
                  </p>
                ) : (
                  <p className="text-slate-500">No apps found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes store-unofficial-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
