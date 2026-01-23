import Link from "next/link";

export default function IntroPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#140d12] text-white">
      <div className="intro-sky absolute inset-0" />
      <div className="intro-stars absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="intro-card intro-float absolute left-[8%] top-[18%] hidden h-28 w-48 rounded-2xl border border-white/20 sm:block" />
      <div className="intro-card intro-float-slow absolute right-[10%] top-[14%] hidden h-32 w-56 rounded-2xl border border-white/20 sm:block" />
      <div className="intro-card intro-float absolute bottom-[18%] right-[18%] hidden h-24 w-44 rounded-2xl border border-white/20 md:block" />

      <div className="intro-sparkle absolute right-[22%] top-[22%] h-3 w-3 rotate-45 rounded-sm bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
      <div className="intro-sparkle absolute left-[18%] bottom-[20%] h-2.5 w-2.5 rotate-45 rounded-sm bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.7)]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-6 text-center">
        <div className="intro-glass w-full rounded-[32px] px-6 py-10 sm:px-10 sm:py-12">
          <div className="text-xs uppercase tracking-[0.3em] text-white/70">
            Northern Americana Tech
          </div>
          <div className="relative mt-6 flex items-center justify-center">
            <div aria-hidden className="intro-rainbow-glow absolute inset-0" />
            <h1 className="relative font-pixel text-2xl text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] sm:text-3xl md:text-4xl">
              /Brooks AI HUB/
            </h1>
          </div>
          <p className="mt-4 text-xs text-white/70 sm:text-sm">
            presented by Northern Americana Tech
          </p>
        </div>

        <Link
          className="intro-start-button rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#1b0f0f] transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          href="/brooks-ai-hub/"
        >
          Tap to Start
        </Link>
      </div>
    </main>
  );
}
