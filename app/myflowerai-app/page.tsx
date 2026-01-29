"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INSTALL_STORAGE_KEY = "ato-app-installed:myflowerai";

export default function MyFlowerAiAppPage() {
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
    router.push("/MyFlowerAI");
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#201018] via-[#1a0f16] to-[#120c16]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#201018]/90 px-4 py-3 backdrop-blur-sm">
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
              alt="MyFlowerAI icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/myflowerai-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">MyFlowerAI</h1>
            <p className="text-xs text-white/60">Cannabis harm reduction</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt="MyFlowerAI icon"
                  className="h-full w-full object-cover"
                  height={64}
                  src="/icons/myflowerai-appicon.png"
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">MyFlowerAI</h2>
                <p className="text-sm text-white/60">Health & Wellness • 21+</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>Rating 4.8</span>
                  <span>15K+ downloads</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <button
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isInstalled
                    ? "bg-emerald-600/80 text-white"
                    : "bg-pink-500 hover:bg-pink-600 text-white"
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
            MyFlowerAI is a cannabis tracking companion built for harm
            reduction. Log your sessions (dose, method, strain, mood/effects),
            attach photos, and get gentle pattern insights over time.
          </p>
          <p className="mt-3 text-xs text-white/55">
            Informational only. Not medical advice. If you are under 21, do not
            use this app.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Agent routes in Brooks AI HUB
          </h3>
          <p className="mt-2 text-sm text-white/70">
            None yet. MyFlowerAI doesn’t expose agentic chat subroutes in Brooks
            AI HUB right now.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/70">
            Placeholder dashboard mock for session tracking, quick logging, and
            AI insights—connecting soon to the{" "}
            <span className="font-mono">/MyFlowerAI/</span> agent.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">
                  Used today
                </div>
                <div className="text-xs text-white/60">3.5g / 5.0g</div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-full bg-white/5 ring-1 ring-white/10">
                  <div className="absolute inset-1 rounded-full bg-[conic-gradient(from_180deg,rgba(236,72,153,0.85)_0_70%,rgba(255,255,255,0.08)_70_100%)]" />
                  <div className="absolute inset-3 rounded-full bg-[#201018] ring-1 ring-white/10" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-white/60">Strains used</div>
                  <div className="text-sm text-white/80">4 entries</div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                AI insights
              </div>
              <p className="mt-2 text-sm text-white/70">
                “Your daytime sativa use correlates with more creative output.
                Consider balancing with calmer sessions to support sleep.”
              </p>
              <p className="mt-3 text-xs text-white/50">
                Placeholder text — will be generated from your logs.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(236,72,153,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.65))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-xs text-white/70">
                Mood & effects chips
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(253,164,175,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.65))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-xs text-white/70">
                Recently logged sessions
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_55%,rgba(147,197,253,0.2),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.65))]" />
              <div className="relative z-10 flex h-full items-center justify-center text-xs text-white/70">
                Photo check-ins
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
