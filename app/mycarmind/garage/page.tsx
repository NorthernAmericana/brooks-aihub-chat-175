import Link from "next/link";

export default function GaragePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-bold">Garage</h1>
        <p className="mt-2 text-sm text-slate-300">
          Garage customization is coming soon. You&apos;ll be able to manage your vehicle profiles,
          perks, and mission loadouts here.
        </p>
        <Link className="mt-4 inline-block rounded-lg border border-white/20 px-3 py-2 text-sm" href="/mycarmind/profile">
          Back to Profile
        </Link>
      </div>
    </main>
  );
}
