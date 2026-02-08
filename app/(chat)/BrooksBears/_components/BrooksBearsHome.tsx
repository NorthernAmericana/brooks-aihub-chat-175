"use client";

import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const MicIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-6 w-6 text-white"
    fill="currentColor"
  >
    <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5Z" />
    <path d="M5 11.5a1 1 0 0 0-2 0 9 9 0 0 0 8 8.94V22a1 1 0 1 0 2 0v-1.56a9 9 0 0 0 8-8.94 1 1 0 1 0-2 0 7 7 0 0 1-14 0Z" />
  </svg>
);

const BenjaminHero = () => (
  <div className="flex flex-col items-center gap-4 text-center">
    <div className="relative h-60 w-60 sm:h-72 sm:w-72 lg:h-80 lg:w-80">
      <ImageWithFallback
        src="/benjamin-bear-pfp.png"
        alt="Benjamin Bear"
        fill
        className="object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
        containerClassName="size-full"
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 288px, 320px"
        priority
      />
    </div>
    <Link
      href="/BrooksBears/BenjaminBear"
      className="flex flex-col items-center gap-2 text-white/90"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/70 shadow-[0_10px_20px_rgba(31,87,255,0.4)] ring-2 ring-white/40">
        <MicIcon />
      </span>
      <span className="text-base font-semibold tracking-wide sm:text-lg">
        Tap to Talk
      </span>
    </Link>
  </div>
);

const SavedMemoriesCard = () => (
  <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/25 bg-white/15 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.35)] backdrop-blur-lg sm:flex-row sm:items-center sm:gap-6 sm:p-6">
    <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-white/10 sm:h-36 sm:w-40">
      <ImageWithFallback
        src="/benjamin-bear-pfp.png"
        alt="Benjamin at the campfire"
        fill
        className="object-cover"
        containerClassName="size-full"
        sizes="(max-width: 640px) 100vw, 160px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-black/35 px-3 py-2 text-sm font-semibold">
        Benjamin
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          Saved Memories
        </h2>
        <p className="text-sm text-white/75 sm:text-base">
          Look back on special times
        </p>
      </div>
      <Link
        href="/BrooksBears/memories"
        className="inline-flex items-center justify-between gap-3 self-start rounded-full bg-blue-500/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(31,87,255,0.35)] ring-1 ring-white/40 transition hover:bg-blue-500"
      >
        Start Session
        <span className="text-lg">›</span>
      </Link>
    </div>
  </div>
);

export default function BrooksBearsHome() {
  return (
    <main className="relative min-h-dvh overflow-hidden text-white">
      <div className="absolute inset-0">
        <ImageWithFallback
          src="/ato/brooksbears/bg-forest.jpg"
          alt="Forest background"
          fill
          sizes="100vw"
          priority
          className="object-cover blur-[2px]"
          containerClassName="size-full"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <header className="relative flex items-start justify-center pt-6 sm:pt-8">
          <h1 className="text-3xl font-semibold tracking-wide text-white sm:text-4xl">
            BrooksBears
          </h1>
          <span className="absolute right-0 inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-sm font-semibold text-white sm:text-base">
            13+
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center py-6 sm:py-10">
          <BenjaminHero />
        </div>

        <footer className="pb-6 sm:pb-10">
          <SavedMemoriesCard />
        </footer>
      </div>
    </main>
  );
}
