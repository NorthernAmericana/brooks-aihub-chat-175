"use client";

import { ArrowLeft, BookMarked } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NamcReaderPage() {
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleCopyRoute = async () => {
    try {
      await navigator.clipboard.writeText("/NAMC/Reader/");
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 woodsy-base soft-vignette">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(120,215,255,0.16),transparent_60%)]" />
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
              <BookMarked className="h-5 w-5 text-cyan-300" />
              <h1 className="font-pixel text-lg text-[#f6e6c8]">NAMC Reader</h1>
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
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/85">
                💎 Founders reading route
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                Welcome to NAMC Reader
              </h2>
              <p className="mt-2 text-sm text-white/75">
                This subroute is designed for focused reading sessions across
                NAMC lore, stories, excerpts, and chapter drafts with clean
                context and spoiler-aware guidance.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-md">
              <h3 className="text-lg font-semibold text-[#f6e6c8]">
                Start a Reader chat
              </h3>
              <p className="mt-2 text-sm text-white/75">
                Open Brooks AI HUB and type
                <code className="mx-1 rounded bg-white/10 px-2 py-1 font-mono text-xs">
                  /NAMC/Reader/
                </code>
                before your prompt.
              </p>
              <p className="mt-2 text-xs font-medium text-cyan-200/90">
                Founders-only access is required for this route.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-cyan-600/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
                  href="/brooks-ai-hub"
                >
                  Open Brooks AI HUB
                </Link>
                <button
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40 ${
                    copyStatus === "success"
                      ? "border-green-500/50 bg-green-500/20 text-green-200"
                      : copyStatus === "error"
                        ? "border-red-500/50 bg-red-500/20 text-red-200"
                        : "border-white/20 bg-white/10 text-white/90 hover:bg-white/20"
                  }`}
                  onClick={handleCopyRoute}
                  type="button"
                >
                  {copyStatus === "success"
                    ? "Copied!"
                    : copyStatus === "error"
                      ? "Failed to copy"
                      : "Copy route command"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
