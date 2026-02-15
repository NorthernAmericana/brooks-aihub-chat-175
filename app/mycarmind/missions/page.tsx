"use client";

import { useEffect, useMemo, useState } from "react";

type TodayMission = {
  date_key: string;
  slug: string;
  title: string;
  description?: string;
  required_count: number;
  points_reward: number;
};

type TodayProgress = {
  date_key: string;
  slug: string;
  progress_count: number;
  completed: boolean;
};

type SeasonMission = {
  id: string;
  name: string;
  description?: string;
  target_count: number;
  points_reward: number;
};

type SeasonProgress = {
  mission_id: string;
  progress_count: number;
  completed_at?: string | null;
};

type MissionsPayload = {
  today?: {
    date_key: string;
    missions: TodayMission[];
    progress: TodayProgress[];
  };
  season?: {
    missions: SeasonMission[];
    progress: SeasonProgress[];
  };
  missions?: SeasonMission[];
};

export default function MissionsPage() {
  const [payload, setPayload] = useState<MissionsPayload>({});

  useEffect(() => {
    fetch("/api/mycarmind/missions")
      .then((res) => res.json())
      .then((data) => setPayload(data));
  }, []);

  const todayProgressBySlug = useMemo(() => {
    return new Map(
      (payload.today?.progress ?? []).map((entry) => [entry.slug, entry])
    );
  }, [payload.today?.progress]);

  const seasonProgressByMissionId = useMemo(() => {
    return new Map(
      (payload.season?.progress ?? []).map((entry) => [entry.mission_id, entry])
    );
  }, [payload.season?.progress]);

  const seasonMissions = payload.season?.missions ?? payload.missions ?? [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Missions</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Today&apos;s Missions</h2>
          <p className="text-xs text-slate-400">
            {payload.today?.date_key ?? ""}
          </p>
          {(payload.today?.missions ?? []).map((mission) => {
            const progress = todayProgressBySlug.get(mission.slug);
            return (
              <article
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                key={`${mission.date_key}-${mission.slug}`}
              >
                <h3 className="font-semibold">{mission.title}</h3>
                <p className="text-sm text-slate-300">{mission.description}</p>
                <p className="text-xs text-emerald-300">
                  Progress {progress?.progress_count ?? 0}/
                  {mission.required_count}
                  {progress?.completed ? " · Completed" : ""} · +
                  {mission.points_reward}
                </p>
              </article>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Season Missions</h2>
          {seasonMissions.map((mission) => {
            const progress = seasonProgressByMissionId.get(mission.id);
            return (
              <article
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                key={mission.id}
              >
                <h3 className="font-semibold">{mission.name}</h3>
                <p className="text-sm text-slate-300">{mission.description}</p>
                <p className="text-xs text-emerald-300">
                  Progress {progress?.progress_count ?? 0}/
                  {mission.target_count}
                  {progress?.completed_at ? " · Completed" : ""} · +
                  {mission.points_reward}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
