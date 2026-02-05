import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NamcStorePage() {
  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#1a1115] via-[#140f16] to-[#110c14]">
      <div className="app-page-header sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-[#1a1115]/90 px-4 py-3 backdrop-blur-sm">
        <Link
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          href="/store"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <Image
              alt="NAMC icon"
              className="h-full w-full object-cover"
              height={36}
              src="/icons/namc-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">NAMC</h1>
            <p className="text-xs text-white/60">Lore, media, and worlds</p>
          </div>
        </div>
      </div>

      <div className="app-page-content flex-1 overflow-y-auto px-4 py-6 -webkit-overflow-scrolling-touch touch-pan-y overscroll-behavior-contain">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                <Image
                  alt="NAMC icon"
                  className="h-full w-full object-cover"
                  height={64}
                  src="/icons/namc-appicon.png"
                  width={64}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">NAMC</h2>
                <p className="text-sm text-white/60">
                  Northern Americana Media Collection
                </p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                  <span>Media & entertainment</span>
                  <span>Curated lore vault</span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-3 text-sm font-semibold text-white transition hover:bg-pink-600 md:w-56"
                href="/NAMC"
              >
                Enter NAMC
              </Link>
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:w-56"
                href="/store"
              >
                Back to store
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">About</h3>
          <p className="mt-2 text-sm text-white/70">
            Dive into the Northern Americana Media Collection. Explore NAMC
            projects, timelines, and characters with a dedicated lore assistant
            that keeps you grounded in canon while sparking new ideas.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">Highlights</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Media vault</div>
              <p className="mt-2 text-xs text-white/60">
                Keep track of NAMC releases, in-world timelines, and media
                spoilers as they evolve.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Lore playground
              </div>
              <p className="mt-2 text-xs text-white/60">
                Build headcanon, plot beats, and character arcs with an AI guide
                that stays on brand.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
