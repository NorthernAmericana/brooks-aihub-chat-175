"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INSTALL_STORAGE_KEY = "ato-app-installed:namc";

export default function NamcAppPage() {
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
    router.push("/NAMC");
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col woodsy-base soft-vignette">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt="NAMC icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/namc-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">/NAMC/</h1>
            <p className="text-xs text-white/70">
              Northern Americana Media Collection
            </p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt="NAMC icon"
                  className="h-full w-full object-cover"
                  height={64}
                  src="/icons/namc-appicon.png"
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">/NAMC/</h2>
                <p className="text-sm text-white/70">Media & Entertainment</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
                  <span>Rating 4.9</span>
                  <span>8K+ downloads</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <button
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isInstalled
                    ? "bg-emerald-600/80 text-white"
                    : "bg-amber-500/90 hover:bg-amber-500 text-[#1b0f0f]"
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

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white">What it is</h3>
          <p className="mt-2 text-sm text-white/75">
            NAMC is a streaming-style home for your Northern Americana projects:
            videos, music, games, photos, lore, and production notes. Browse
            featured picks, keep playlists, and jump into cozy modes for focused
            discovery.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white">
            Agent routes in Brooks AI HUB
          </h3>
          <p className="mt-2 text-sm text-white/75">
            NAMC has agentic chat subroutes in Brooks AI HUB for specialized
            assistance. The main /NAMC/ route will suggest Lore Playground when
            users want lore or headcanon help for any media.
          </p>
          <div className="mt-4 space-y-3">
            <Link
              className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/20 px-4 py-3 transition hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              href="/NAMC/lore-playground"
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  /NAMC/Lore-Playground/
                </div>
                <div className="mt-0.5 text-xs text-white/70">
                  Explore NAMC lore + external media lore, headcanon support,
                  and spoiler-aware discussions
                </div>
              </div>
              <div className="text-xs text-white/60">Open</div>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/75">
            A Netflix/Spotify-style layout with shelves for collections and
            trending items—built to expand into games, videos, albums, and lore
            chapters.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,196,122,0.35),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Featured hero + watch buttons
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(140,190,255,0.25),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.85))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                Shelves for games + media cards
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
