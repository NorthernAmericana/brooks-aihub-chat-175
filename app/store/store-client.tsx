"use client";

import { ArrowLeft, Download, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

  const filteredApps = useMemo(() => {
    if (!searchQuery) {
      return apps;
    }
    const query = searchQuery.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(query));
  }, [apps, searchQuery]);

  return (
    <div className="store-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#140d12] via-[#1a0f16] to-[#120c16]">
      <div className="store-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#140d12]/95 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-pixel text-lg text-white">ATO Store</h1>
      </div>

      <div className="store-search px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            className="w-full rounded-full border border-white/20 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search apps..."
            type="text"
            value={searchQuery}
          />
        </div>
        {!hasSession && (
          <p className="mt-3 text-xs text-white/50">
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
                className="store-app-card group cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                key={app.id}
                onClick={() => {
                  if (targetPath) {
                    router.push(targetPath);
                  }
                }}
                type="button"
              >
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white/20 to-white/10 shadow-lg">
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
                      <div className="text-xs text-white/50">No icon</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{app.name}</h3>
                      {app.isInstalled && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
                          Installed
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/60">
                      {app.category ?? "ATO"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                      <span>{app.routeCount} routes</span>
                      {app.isOfficial && <span>Official</span>}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center">
                    <span className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-xs font-medium text-white transition group-hover:bg-white/20">
                      <Download className="h-3.5 w-3.5" />
                      {actionLabel}
                    </span>
                  </div>
                </div>

                {app.description && (
                  <p className="mt-3 text-sm text-white/70">
                    {app.description}
                  </p>
                )}
              </button>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-white/50">No apps found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
