"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const INSTALL_STORAGE_KEY = "ato-app-installed:mycarmindato";

export default function MyCarMindATOAppPage() {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasHydratedInstallState, setHasHydratedInstallState] = useState(false);

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

  const handleInstallClick = () => {
    if (!isInstalled) {
      setIsInstalled(true);
    }
  };

  const handleGoToApp = () => {
    router.push("/MyCarMindATO");
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
            <ImageWithFallback
              alt="MyCarMindATO icon"
              className="h-full w-full object-cover"
              containerClassName="size-full"
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
                <ImageWithFallback
                  alt="MyCarMindATO icon"
                  className="h-full w-full object-cover"
                  containerClassName="size-full"
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
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/70">
            Map-first layouts, mission tracking, and town mastery live in the
            ATO app view.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f2a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,140,220,0.35),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.2),rgba(5,15,24,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Map discovery preview
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#121c24]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,191,159,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,15,24,0.2),rgba(5,15,24,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Mission dashboard preview
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
