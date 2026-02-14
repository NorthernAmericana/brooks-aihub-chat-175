"use client";

import { use, useEffect, useState } from "react";

type Payload = {
  place?: {
    id: string;
    name: string;
    description?: string;
    city: string;
    state: string;
    category: string;
  };
  sources?: Array<{ citation_url?: string; citation_title?: string }>;
  missions?: Array<{ id: string; name: string; points_reward: number }>;
};

export default function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Payload>({});
  const [publishToCommons, setPublishToCommons] = useState(true);

  useEffect(() => {
    fetch(`/api/mycarmind/place/${id}`)
      .then((res) => res.json())
      .then(setData);
  }, [id]);

  const markVisited = async () => {
    await fetch("/api/mycarmind/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ placeId: id }),
    });
    alert("Visit logged + points awarded");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">{data.place?.name ?? "Place"}</h1>
        <p className="text-sm text-slate-300">{data.place?.description}</p>
        <button
          className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-black"
          onClick={markVisited}
          type="button"
        >
          Log Visit (+10)
        </button>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold">Add photo/video</h2>
          <p className="text-sm text-slate-300">
            Use /api/mycarmind/media/upload-url + /api/mycarmind/media/attach for
            signed uploads.
          </p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              checked={publishToCommons}
              onChange={(event) => setPublishToCommons(event.target.checked)}
              type="checkbox"
            />
            Share to Commons
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold">Mission relevance</h2>
          {(data.missions ?? []).map((mission) => (
            <p key={mission.id} className="text-sm text-slate-300">
              {mission.name} (+{mission.points_reward})
            </p>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold">Sources</h2>
          {(data.sources ?? []).map((source) => (
            <a
              key={source.citation_url}
              className="block text-sm text-emerald-300 underline"
              href={source.citation_url}
              rel="noreferrer"
              target="_blank"
            >
              {source.citation_title ?? source.citation_url}
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
