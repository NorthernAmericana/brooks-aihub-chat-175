import Link from "next/link";

const tiles = [
  { href: "/mycarmind/explore", label: "Explore", subtitle: "Map/List place hunting" },
  { href: "/mycarmind/missions", label: "Missions", subtitle: "Season quests + badges" },
  { href: "/mycarmind/leaderboard", label: "Leaderboard", subtitle: "Global, state, city ranks" },
  { href: "/mycarmind/profile", label: "Profile", subtitle: "Driver stats + garage" },
];

export default function MycarmindHomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-emerald-950 px-4 py-6 text-slate-100">
      <header className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">MyCarMindATO</p>
        <h1 className="mt-2 text-3xl font-bold">Travel Intelligence Field Guide</h1>
        <p className="mt-2 text-sm text-slate-300">Gamified road exploration powered by curated registry places, missions, and citation-forward details.</p>
      </header>
      <section className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="text-lg font-semibold">{tile.label}</h2>
            <p className="text-sm text-slate-300">{tile.subtitle}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
