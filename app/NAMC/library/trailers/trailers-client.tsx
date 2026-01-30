"use client";

import { ArrowLeft, Film } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { NAMC_TRAILERS } from "@/lib/namc-trailers";

const fallbackTrailer = NAMC_TRAILERS[0];

export default function TrailersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("trailer");
  const selectedTrailer = useMemo(
    () =>
      NAMC_TRAILERS.find((trailer) => trailer.id === selectedId) ??
      fallbackTrailer,
    [selectedId]
  );

  return (
    <div className="fixed inset-0 z-50 woodsy-base soft-vignette">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,4,0.15),rgba(10,6,4,0.78))]" />
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
              <Film className="h-5 w-5 text-white/80" />
              <h1 className="font-pixel text-lg text-[#f6e6c8]">
                Concept Trailers
              </h1>
            </div>
          </div>
          <Link
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
            href="/NAMC/library"
          >
            Library
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <section className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Prompt menu
              </p>
              <h2 className="mt-3 text-lg font-semibold text-[#f6e6c8]">
                Choose a trailer
              </h2>
              <p className="mt-2 text-sm text-white/70">
                All available concept trailers for the video game.
              </p>

              <div className="mt-4 space-y-2">
                {NAMC_TRAILERS.map((trailer) => {
                  const isActive = trailer.id === selectedTrailer.id;
                  return (
                    <Link
                      className={`flex flex-col gap-1 rounded-2xl border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40 ${
                        isActive
                          ? "border-amber-300/50 bg-white/10 text-[#f6e6c8]"
                          : "border-white/10 bg-black/30 text-white/80 hover:border-white/20 hover:bg-white/5"
                      }`}
                      href={{
                        pathname: "/NAMC/library/trailers",
                        query: { trailer: trailer.id },
                      }}
                      key={trailer.id}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        {trailer.category}
                      </span>
                      <span className="font-semibold">{trailer.title}</span>
                      <span className="text-xs text-white/65">
                        {trailer.subtitle}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Now playing
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#f6e6c8]">
                {selectedTrailer.title}
              </h2>
              <p className="mt-2 text-sm text-white/75">
                {selectedTrailer.subtitle}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {selectedTrailer.description}
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div className="relative aspect-video w-full">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                    src={selectedTrailer.embedUrl}
                    title={`${selectedTrailer.title} trailer`}
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
