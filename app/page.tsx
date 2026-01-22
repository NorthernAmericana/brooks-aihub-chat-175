import Link from "next/link";

export default function IntroPage() {
  return (
    <main className="intro-screen relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 text-white">
      <div className="intro-sky absolute inset-0" />
      <div className="intro-stars absolute inset-0" />

      <div className="intro-orb intro-orb--left absolute -left-24 top-10" />
      <div className="intro-orb intro-orb--right absolute -right-28 bottom-16" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
        <div className="intro-panel relative w-full max-w-3xl rounded-[2.5rem] border border-white/20 bg-white/10 px-6 py-12 shadow-[0_30px_120px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:px-10">
          <div className="intro-panel-glow pointer-events-none absolute inset-0 rounded-[2.5rem]" />
          <p className="text-xs uppercase tracking-[0.35em] text-white/70 sm:text-sm">
            presented by Northern Americana Tech
          </p>
          <h1 className="mt-5 text-balance font-semibold text-3xl tracking-tight text-white sm:text-5xl">
            <span className="intro-title">/Brooks AI HUB/</span>
          </h1>
          <p className="mt-6 text-sm text-white/70 sm:text-base">
            Step into the retro-future of AI. Explore, create, and collaborate
            in a world built for Brooks innovators.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-white/70">
            <span className="intro-chip">DATA</span>
            <span className="intro-chip">FOREST</span>
            <span className="intro-chip">RETRO</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-center sm:bottom-12">
        <Link
          className="intro-cta group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/60 hover:bg-white/20"
          href="/Brooks AI HUB/"
        >
          Tap to start
          <span className="intro-cta-dot h-2 w-2 rounded-full bg-white/80" />
        </Link>
        <p className="text-xs text-white/60">
          Journey into the Brooks AI HUB experience.
        </p>
      </div>
    </main>
  );
}
