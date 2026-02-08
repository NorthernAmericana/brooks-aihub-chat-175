"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import type { StoreAppListItem } from "@/lib/store/listAppsWithInstallState";

const actionLabelForApp = (app: StoreAppListItem) => {
  if (app.isInstalled && app.appPath) {
    return "Open";
  }
  return "View";
};

type StoreClientProps = {
  apps: StoreAppListItem[];
  hasSession: boolean;
};

export function StoreClient({ apps, hasSession }: StoreClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useSwipeGesture({
    edgeZone: 56,
    threshold: 90,
    onSwipeLeftFromRightEdge: () => router.push("/store/namc"),
    onSwipeRightFromLeftEdge: () => router.push("/brooks-ai-hub"),
  });

  const filteredApps = useMemo(() => {
    if (!searchQuery) {
      return apps;
    }
    const query = searchQuery.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(query));
  }, [apps, searchQuery]);

  const hasSearchQuery = searchQuery.trim().length > 0;
  const isCatalogUnavailable = apps.length === 0;

  return (
    <div className="store-overlay fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900">
      <button
        aria-label="Swipe right to go back to Brooks AI HUB"
        className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-r-full border border-l-0 border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
        onClick={() => router.push("/brooks-ai-hub")}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Brooks AI HUB</span>
      </button>

      <button
        aria-label="Swipe left to go to NAMC Store"
        className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-l-full border border-r-0 border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
        onClick={() => router.push("/store/namc")}
        type="button"
      >
        <span className="hidden sm:inline">Go to NAMC Store</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="store-header sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-pixel text-lg text-slate-900">The Official ATO Store</h1>
      </div>

      <div className="store-search px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:outline-none"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search apps..."
            type="text"
            value={searchQuery}
          />
        </div>
        {!hasSession && (
          <p className="mt-3 text-xs text-slate-500">
            Sign in to install and manage your ATO apps.
          </p>
        )}
      </div>

      <div className="store-content flex-1 overflow-y-auto -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain px-4 pb-6">
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const actionLabel = actionLabelForApp(app);
            const targetPath = app.storePath ?? app.appPath;

            return (
              <button
                className="store-app-card group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-300"
                key={app.id}
                onClick={() => {
                  if (targetPath) {
                    router.push(targetPath);
                  }
                }}
                type="button"
              >
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                    {app.iconUrl ? (
                      <Image
                        alt={`${app.name} icon`}
                        className="h-full w-full object-cover"
                        height={64}
                        priority={false}
                        src={app.iconUrl}
                        width={64}
                      />
                    ) : (
                      <div className="text-xs text-slate-400">No icon</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{app.name}</h3>
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

                  <div className="flex flex-shrink-0 items-center">
                    <span className="flex h-9 items-center gap-2 rounded-full bg-slate-100 px-4 text-xs font-medium text-slate-700 transition group-hover:bg-slate-200">
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
              </button>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {hasSearchQuery ? (
                <p className="text-slate-500">No apps match your search.</p>
              ) : isCatalogUnavailable ? (
                <p className="text-slate-500">The app catalog is temporarily unavailable.</p>
              ) : (
                <p className="text-slate-500">No apps found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
