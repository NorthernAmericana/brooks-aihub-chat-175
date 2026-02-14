"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Place = { id: string; name: string; city: string; state: string; category: string; description?: string };

export default function ExplorePage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    fetch("/api/mycarmind/places").then((res) => res.json()).then((data) => setPlaces(data.places ?? []));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Explore</h1>
          <div className="rounded-full border border-white/15 p-1 text-xs">
            <button className={`rounded-full px-3 py-1 ${view === "list" ? "bg-emerald-500 text-black" : "text-slate-300"}`} onClick={() => setView("list")} type="button">List</button>
            <button className={`rounded-full px-3 py-1 ${view === "map" ? "bg-emerald-500 text-black" : "text-slate-300"}`} onClick={() => setView("map")} type="button">Map</button>
          </div>
        </div>

        {view === "map" ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Map renderer placeholder: wire this container to Google Maps and consume markers from <code>/api/mycarmind/places</code>.</div>
        ) : (
          <div className="space-y-3">
            {places.map((place) => (
              <Link key={place.id} href={`/mycarmind/place/${place.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="font-semibold">{place.name}</h2>
                <p className="text-sm text-slate-300">{place.city}, {place.state} · {place.category}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
