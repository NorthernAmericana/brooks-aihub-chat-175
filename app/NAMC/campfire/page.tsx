"use client";

import { ArrowLeft, Flame } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NamcCampfirePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 woodsy-base soft-vignette">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,186,120,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,4,0.15),rgba(10,6,4,0.84))]" />
      <div className="relative flex h-dvh flex-col text-white">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
              onClick={() => router.back()}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-200" />
              <h1 className="font-pixel text-lg text-[#f6e6c8]">Campfire</h1>
            </div>
          </div>
          <Link
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
            href="/NAMC"
          >
            Home
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Cozy mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
              Campfire browsing is coming soon
            </h2>
            <p className="mt-2 text-sm text-white/75">
              This route is reserved for a more focused, low-distraction
              experience: fewer shelves, bigger cards, and a “cozy-dread” vibe
              slider for discovery.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
