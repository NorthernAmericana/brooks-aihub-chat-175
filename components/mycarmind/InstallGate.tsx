"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

const BYPASS_KEY = "mycarmind-install-gate-bypass";

function isInstalled() {
  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const standaloneMode =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches;

  return iosStandalone || standaloneMode;
}

export function InstallGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    const bypass = window.localStorage.getItem(BYPASS_KEY) === "true";
    setBypassed(bypass);
    setInstalled(isInstalled());
    setReady(true);

    const media = window.matchMedia("(display-mode: standalone)");
    const onChange = () => setInstalled(isInstalled());
    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, []);

  if (!ready) {
    return null;
  }

  if (installed || bypassed) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
          MyCarMindATO
        </p>
        <h1 className="mt-2 text-2xl font-bold">Install required</h1>
        <p className="mt-2 text-sm text-slate-300">
          For the best in-car experience, install MyCarMindATO as a web app.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
            href="/mycarmind/install"
          >
            View install instructions
          </Link>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={() => {
              window.localStorage.setItem(BYPASS_KEY, "true");
              setBypassed(true);
            }}
            type="button"
          >
            Continue in browser
          </button>
        </div>
      </div>
    </main>
  );
}
