"use client";

import { ArrowLeft, Check, Download, Keyboard, Mic, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrooksBearsHistoryPanel } from "@/components/brooksbears/brooksbears-history-panel";
import { BrooksBearsVoiceExperience } from "@/components/brooksbears/brooksbears-voice-experience";

const INSTALL_STORAGE_KEY = "ato-app-installed:brooksbears";

export default function BrooksBearsAppPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
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

  if (!isInstalled) {
    return (
      <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#1b1118] via-[#160e14] to-[#120c16] text-white">
        <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1b1118]/90 px-4 py-3 backdrop-blur-sm">
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
                alt="BrooksBears icon"
                className="h-full w-full object-cover"
                height={36}
                src="/icons/brooksbears-appicon.png"
                width={36}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">BrooksBears</h1>
              <p className="text-xs text-white/60">Companion chats & stories</p>
            </div>
          </div>
        </div>

        <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 space-y-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                  <Image
                    alt="BrooksBears icon"
                    className="h-full w-full object-cover"
                    height={64}
                    src="/icons/brooksbears-appicon.png"
                    width={64}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">BrooksBears</h2>
                  <p className="text-sm text-white/60">Entertainment • 13+</p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                    <span>Rating 4.9</span>
                    <span>12K+ downloads</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto">
                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition md:w-56 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isInstalled
                      ? "bg-emerald-600/80 text-white"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
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
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">About</h3>
            <p className="mt-2 text-sm text-white/70">
              BrooksBears is a cozy companion experience with Benjamin Bear,
              blending storytelling, jokes, and friendly check-ins inside Brooks
              AI HUB.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">
              Routes in Brooks AI HUB
            </h3>
            <div className="mt-3 space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="font-mono">/BrooksBears/</span>
                <span className="text-xs text-white/50">
                  Main companion space
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="font-mono">/BrooksBears/BenjaminBear/</span>
                <span className="text-xs text-white/50">
                  Benjamin Bear focus
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            <p className="mt-2 text-sm text-white/70">
              Voice-first conversations, quick stories, and gentle check-ins
              await inside the BrooksBears app view.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#1f1218]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,150,180,0.35),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,8,12,0.2),rgba(13,8,12,0.85))]" />
                <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                  Storytelling preview
                </div>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1016]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(142,255,226,0.25),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,8,12,0.2),rgba(13,8,12,0.85))]" />
                <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/70">
                  Friendly chat preview
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#140d12] via-[#1a0f16] to-[#120c16] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#140d12]/90 px-6 py-4 backdrop-blur">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            /BrooksBears/
          </p>
          <h1 className="font-pixel text-lg text-white">Benjamin Bear</h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10">
            <Image
              src="/icons/brooksbears-appicon.png"
              alt="Benjamin Bear"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Benjamin</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Listening
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTab === "chat" ? (
          <div className="px-6 py-6">
            <BrooksBearsVoiceExperience className="max-w-lg" />
          </div>
        ) : (
          <BrooksBearsHistoryPanel isAuthenticated={Boolean(session?.user)} />
        )}
      </main>

      <div className="border-t border-white/10 bg-[#140d12]/95 px-6 py-4">
        {activeTab === "chat" ? (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3 text-white/60">
              <Keyboard className="h-5 w-5" />
              <span className="text-sm">Type a message...</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                type="button"
                aria-label="Start voice message"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a2533] text-white transition hover:bg-[#4a3141]"
                type="button"
                aria-label="Start call"
              >
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs uppercase tracking-[0.2em] text-white/40">
            BrooksBears History
          </div>
        )}
      </div>

      <nav className="border-t border-white/10 bg-[#120c16] px-6 py-3">
        <div className="flex items-center justify-around">
          <button
            type="button"
            className={`flex flex-col items-center gap-1 text-sm font-semibold ${
              activeTab === "chat" ? "text-white" : "text-white/50"
            }`}
            onClick={() => setActiveTab("chat")}
          >
            <span
              className={`h-1.5 w-6 rounded-full ${
                activeTab === "chat" ? "bg-emerald-400" : "bg-transparent"
              }`}
            />
            Chat
          </button>
          <button
            type="button"
            className={`flex flex-col items-center gap-1 text-sm font-semibold ${
              activeTab === "history" ? "text-white" : "text-white/50"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <span
              className={`h-1.5 w-6 rounded-full ${
                activeTab === "history" ? "bg-emerald-400" : "bg-transparent"
              }`}
            />
            History
          </button>
        </div>
      </nav>
    </div>
  );
}
