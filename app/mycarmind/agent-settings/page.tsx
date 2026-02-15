import Link from "next/link";

export default function AgentSettingsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-bold">Agent Settings</h1>
        <p className="mt-2 text-sm text-slate-300">
          Agent controls are in progress. You can still continue using MyCarMind in Chrome without
          installing as a PWA by using the "Continue in browser" option from the install gate.
        </p>
        <Link className="mt-4 inline-block rounded-lg border border-white/20 px-3 py-2 text-sm" href="/mycarmind/profile">
          Back to Profile
        </Link>
      </div>
    </main>
  );
}
