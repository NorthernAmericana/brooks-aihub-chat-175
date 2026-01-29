"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MyFlowerAIDashboardPreview } from "@/components/myflowerai/ato-dashboard-preview";

const INSTALL_STORAGE_KEY = "ato-app-installed:myflowerai";
const MYFLOWERAI_APP_PATH = "/MyFlowerAI";

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
    router.push(MYFLOWERAI_APP_PATH);
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
            Live ATO preview from the MyFlowerAI dashboard. Launch the ATO app
            to connect to <span className="font-mono">/MyFlowerAI/</span> for
            agentic check-ins, data visualization, and photo-based logging.
          </p>
          <MyFlowerAIDashboardPreview />
        </section>
      </div>
    </div>
  );
}
