"use client";
import { useEffect, useState } from "react";

type Mission = { id: string; name: string; description?: string; progress_count: number; target_count: number; points_reward: number };

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  useEffect(() => { fetch("/api/mycarmind/missions").then((res) => res.json()).then((data) => setMissions(data.missions ?? [])); }, []);

  return <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100"><div className="mx-auto max-w-3xl space-y-3"><h1 className="text-2xl font-bold">Missions</h1>{missions.map((m)=><article key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-semibold">{m.name}</h2><p className="text-sm text-slate-300">{m.description}</p><p className="text-xs text-emerald-300">Progress {m.progress_count}/{m.target_count} · +{m.points_reward}</p></article>)}</div></main>;
}
