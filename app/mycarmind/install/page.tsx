"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Platform = "android-chrome" | "ios-safari" | "other";

function detectInstalled() {
  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const standaloneMode =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches;

  return iosStandalone || standaloneMode;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes("android");
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isChrome = ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr");
  const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("crios");

  if (isAndroid && isChrome) {
    return "android-chrome";
  }

  if (isIOS && isSafari) {
    return "ios-safari";
  }

  return "other";
}

export default function MycarmindInstallPage() {
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setInstalled(detectInstalled());
    setPlatform(detectPlatform());

    const media = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setInstalled(detectInstalled());
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, []);

  const instructions = useMemo(() => {
    if (platform === "android-chrome") {
      return [
        "Open the Chrome menu (⋮) in the top-right.",
        "Tap Install app (or Add to Home screen).",
        "Confirm Install and launch from your home screen.",
      ];
    }

    if (platform === "ios-safari") {
      return [
        "Open this page in Safari.",
        "Tap the Share button (square with arrow).",
        "Tap Add to Home Screen, then Add.",
      ];
    }

    return [
      "Use Chrome on Android or Safari on iOS for guided install.",
      "Install from your browser menu, then reopen this app.",
    ];
  }, [platform]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-blue-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">MyCarMindATO</p>
        <h1 className="mt-2 text-2xl font-bold">Install MyCarMindATO</h1>

        {installed ? (
          <p className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Installed detected. You can continue to the app.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-300">
              Install to unlock the full-screen mobile driving experience.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-200">
              {instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
            onClick={() => setInstalled(detectInstalled())}
            type="button"
          >
            I installed it
          </button>
          <Link className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/mycarmind">
            Back to app home
          </Link>
        </div>
      </div>
    </main>
  );
}
