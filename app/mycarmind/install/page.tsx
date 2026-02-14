import Link from "next/link";

export default function MycarmindInstallPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-blue-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">ATO Store</p>
        <h1 className="mt-2 text-2xl font-bold">Install MyCarMindATO</h1>
        <p className="mt-2 text-sm text-slate-300">Unlock gamified travel intelligence, route missions, city leaderboards, and citation-forward place guides.</p>
        <div className="mt-5 flex gap-3">
          <Link className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black" href="/store/ato/mycarmindato">Install via Store</Link>
          <Link className="rounded-full border border-white/20 px-4 py-2 text-sm" href="/mycarmind">Open app</Link>
        </div>
      </div>
    </main>
  );
}
