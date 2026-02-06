import Link from "next/link";

export default function NamcReaderAppPage() {
  return (
    <main className="min-h-screen bg-[#120c16] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
          NAMC Reader
        </p>
        <h1 className="mt-3 text-3xl font-bold">Coming soon</h1>
        <p className="mt-3 text-sm text-white/75">
          NAMC Reader is currently staged for release. You can view it in the ATO
          Store today, and installation will be enabled in an upcoming rollout.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          href="/store"
        >
          Back to ATO Store
        </Link>
      </div>
    </main>
  );
}
