"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Flame,
  LineChart,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INSTALL_STORAGE_KEY = "ato-app-installed:myflowerai";
const MYFLOWERAI_CHAT_PATH = "/brooks-ai-hub?query=%2FMyFlowerAI%2F";

const strainEntries = [
  { id: "purple-haze", name: "Purple Haze", amount: "+2g" },
  { id: "og-kush", name: "OG Kush", amount: "+1.5g" },
];

const moodTags = ["Calm", "Creative", "Focused", "Relaxed", "Sleepy", "Balanced"];

const featureTiles = [
  {
    id: "connect",
    title: "Connect to /MyFlowerAI/",
    description:
      "Route check-ins to the MyFlowerAI agentic AI for journaling and guidance.",
    icon: Sparkles,
    accent: "text-rose-200",
  },
  {
    id: "tracking",
    title: "Visualize tracking behavior",
    description:
      "Review dose, method, and mood trends across sessions for harm reduction.",
    icon: LineChart,
    accent: "text-pink-200",
  },
  {
    id: "capture",
    title: "Capture strain + method",
    description:
      "Take photos of flower, gear, and setup to compare effects over time.",
    icon: Camera,
    accent: "text-amber-200",
  },
];

export default function MyFlowerAIAppPage() {
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
    router.push(MYFLOWERAI_CHAT_PATH);
  };

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#2b1220] via-[#361325] to-[#1f0e19]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1f0e19]/90 px-4 py-3 backdrop-blur-sm">
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
            <p className="text-xs text-white/70">Cannabis harm reduction</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6">
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
                <p className="text-sm text-white/70">Health & Wellness - 21+</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
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
                    : "bg-rose-500/90 hover:bg-rose-500 text-white"
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
            MyFlowerAI is a cannabis harm-reduction tracker. Log strain, dose,
            method, and mood, then review trends with gentle guidance from the
            MyFlowerAI agent. Capture photos of flower and setups to keep
            sessions consistent and intentional.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">
            Agent routes in Brooks AI HUB
          </h3>
          <p className="mt-2 text-sm text-white/70">
            None yet. MyFlowerAI does not have agentic chat subroutes in Brooks
            AI HUB right now.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="mt-2 text-sm text-white/70">
            Placeholder layout inspired by the MyFlowerAI tracker UI. The ATO app
            will connect to <span className="font-mono">/MyFlowerAI/</span> for
            agentic check-ins, data visualization, and photo-based logging.
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[36px] border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                        <Image
                          alt="MyFlowerAI icon"
                          height={28}
                          src="/icons/myflowerai-appicon.png"
                          width={28}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        MyFlowerAI
                      </span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/70">
                      1 Strain
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Used today</span>
                          <Flame className="h-3 w-3 text-rose-200" />
                        </div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          3.5g / 5.0g
                        </div>
                        <div className="mt-3 flex items-center justify-center">
                          <div className="relative h-12 w-12 rounded-full border-4 border-rose-400/50">
                            <div className="absolute inset-2 rounded-full border-2 border-rose-200/50" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-white/60">Strains used</div>
                        <div className="mt-2 space-y-1 text-xs text-white/70">
                          {strainEntries.map((entry) => (
                            <div
                              className="flex items-center justify-between"
                              key={entry.id}
                            >
                              <span>{entry.name}</span>
                              <span className="text-white/60">
                                {entry.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/60">Mood & effects</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {moodTags.map((tag) => (
                          <span
                            className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/70"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Recently logged</span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                          12:42 PM
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[10px] text-white/50">
                          Photo
                        </div>
                        <div>
                          <div className="text-sm text-white">Sativa joint</div>
                          <div className="text-xs text-white/60">
                            Method: joint - Dose 0.4g
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Sparkles className="h-3 w-3 text-rose-200" />
                        AI insights & feedback
                      </div>
                      <p className="mt-2 text-xs text-white/70">
                        Balance daytime creativity with smaller evening doses
                        for gentler sleep and recovery.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Camera className="h-3 w-3 text-white/70" />
                        Add a strain or gear photo
                      </div>
                      <p className="mt-2 text-xs text-white/60">
                        Tag flower, carts, or tools with your session notes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {featureTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    key={tile.id}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <Icon className={`h-5 w-5 ${tile.accent}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {tile.title}
                        </h4>
                        <p className="mt-1 text-xs text-white/70">
                          {tile.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
