"use client";

import { useEffect, useMemo, useState } from "react";
import { InstallGate } from "@/components/mycarmind/InstallGate";

type Scope = "global" | "state" | "city";

type Row = {
  rank: number;
  user_id: string;
  display_name: string;
  subtitle: string | null;
  points: number;
  visits_count: number;
  missions_completed: number;
};

const TIER_LABELS = [
  "Road Rookie",
  "City Scout",
  "Highway Hero",
  "Route Ranger",
  "Map Master",
  "Legendary Traveler",
] as const;

function getTierLabel(points: number) {
  const tier = Math.floor(points / 250) + 1;
  const index = Math.min(tier - 1, TIER_LABELS.length - 1);
  return `Tier ${tier} · ${TIER_LABELS[index]}`;
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);

    fetch(`/api/mycarmind/leaderboard?scope=${scope}`)
      .then(async (res) => {
        const data = await res.json();
        if (!active) {
          return;
        }

        if (!res.ok) {
          setMessage(data.error ?? "Unable to load leaderboard.");
          setRows([]);
          return;
        }

        if (data.missingProfile === "home_state") {
          setMessage(
            "Set your home state in Profile to view this leaderboard."
          );
        } else if (data.missingProfile === "home_city") {
          setMessage("Set your home city in Profile to view this leaderboard.");
        } else {
          setMessage(null);
        }

        setRows(data.leaderboard ?? []);
      })
      .catch(() => {
        if (active) {
          setRows([]);
          setMessage("Unable to load leaderboard.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [scope]);

  const tabs = useMemo(
    () => [
      { key: "global" as const, label: "Global" },
      { key: "state" as const, label: "My State" },
      { key: "city" as const, label: "My City" },
    ],
    []
  );

  return (
    <InstallGate>
      <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-2xl font-bold">Leaderboard</h1>

        <div className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                scope === tab.key
                  ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                  : "border-white/15 bg-white/5 text-slate-300"
              }`}
              key={tab.key}
              onClick={() => setScope(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mb-3 text-sm text-amber-200">{message}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-slate-300">Loading leaderboard…</p>
        ) : null}

        {rows.map((row) => (
          <div
            className="mb-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
            key={row.user_id}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="mr-2 text-emerald-300">#{row.rank}</span>
                <span className="font-semibold">{row.display_name}</span>
                {row.subtitle ? (
                  <p className="text-xs text-slate-300">{row.subtitle}</p>
                ) : null}
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>{getTierLabel(row.points)}</p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <p>
                <span className="block text-slate-400">Points</span>
                <span className="text-slate-100">{row.points}</span>
              </p>
              <p>
                <span className="block text-slate-400">Visits</span>
                <span className="text-slate-100">{row.visits_count}</span>
              </p>
              <p>
                <span className="block text-slate-400">Missions</span>
                <span className="text-slate-100">{row.missions_completed}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      </main>
    </InstallGate>
  );
}
