"use client";
import { useEffect, useState } from "react";

type Row = { user_id: string; display_name: string; points: number; visits_count: number; missions_completed: number };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/mycarmind/leaderboard?scope=global").then((res) => res.json()).then((data) => setRows(data.leaderboard ?? [])); }, []);

  return <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100"><div className="mx-auto max-w-3xl"><h1 className="mb-3 text-2xl font-bold">Leaderboard</h1>{rows.map((row,i)=><div key={row.user_id} className="mb-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><span className="mr-2 text-emerald-300">#{i+1}</span>{row.display_name} · {row.points} pts</div>)}</div></main>;
}
