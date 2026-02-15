"use client";

import { useEffect, useMemo, useState } from "react";
import { PlaceDetailSheet } from "@/components/mycarmind/place-detail-sheet";

type Place = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  category?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
};

const FALLBACK_CATEGORIES = ["Coffee", "Thrift", "Food", "Parks", "Museums"];

function formatDistanceMiles(
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMi = 3958.8;
  const dLat = toRadians(placeLat - userLat);
  const dLng = toRadians(placeLng - userLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(placeLat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return `${(earthRadiusMi * c).toFixed(1)} mi`;
}

export default function ExplorePage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        setLat(null);
        setLng(null);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) {
        params.set("q", q.trim());
      }
      if (city.trim()) {
        params.set("city", city.trim());
      }
      if (state.trim()) {
        params.set("state", state.trim());
      }
      if (lat !== null) {
        params.set("lat", String(lat));
      }
      if (lng !== null) {
        params.set("lng", String(lng));
      }
      params.set("limit", "100");

      const response = await fetch(
        `/api/mycarmind/places?${params.toString()}`,
        { signal: controller.signal }
      );
      if (!response.ok) {
        setPlaces([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setPlaces((data.places ?? []) as Place[]);
      setLoading(false);
    };

    run().catch(() => setLoading(false));
    return () => controller.abort();
  }, [q, city, state, lat, lng]);

  const categories = useMemo(() => {
    const dynamicCategories = places
      .map((place) => place.category?.trim())
      .filter((category): category is string => Boolean(category));

    return Array.from(new Set([...FALLBACK_CATEGORIES, ...dynamicCategories]));
  }, [places]);

  const openPlace = (place: Place) => {
    setSelectedPlace(place);
    setSheetOpen(true);
  };

  const filteredPlaces = useMemo(() => {
    if (!selectedCategory) {
      return places;
    }

    return places.filter((place) =>
      (place.category ?? "")
        .toLowerCase()
        .includes(selectedCategory.toLowerCase())
    );
  }, [places, selectedCategory]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Explore</h1>
          <div className="rounded-full border border-white/15 p-1 text-xs">
            <button
              className={`rounded-full px-3 py-1 ${view === "list" ? "bg-emerald-500 text-black" : "text-slate-300"}`}
              onClick={() => setView("list")}
              type="button"
            >
              List
            </button>
            <button
              className={`rounded-full px-3 py-1 ${view === "map" ? "bg-emerald-500 text-black" : "text-slate-300"}`}
              onClick={() => setView("map")}
              type="button"
            >
              Map
            </button>
          </div>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <input
            aria-label="Search places"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search places"
            value={q}
          />
          <input
            aria-label="City"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            value={city}
          />
          <input
            aria-label="State"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onChange={(event) => setState(event.target.value)}
            placeholder="State"
            value={state}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              className={`rounded-full border px-3 py-1 text-xs ${selectedCategory === category ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : "border-white/20 text-slate-300"}`}
              key={category}
              onClick={() =>
                setSelectedCategory((current) =>
                  current === category ? null : category
                )
              }
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {view === "map" ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            {mapKey ? (
              <p>
                Map integration ready. Hook marker coordinates to Google Maps
                using the loaded places.
              </p>
            ) : (
              <p>
                Google Maps key not found. You can still browse curated results
                in list mode and open details from markers below.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredPlaces.slice(0, 8).map((place) => (
                <button
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-left"
                  key={place.id}
                  onClick={() => openPlace(place)}
                  type="button"
                >
                  <p className="font-medium text-slate-100">{place.name}</p>
                  <p className="text-xs text-slate-400">Marker preview</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-slate-400">Loading places...</p>
            ) : null}
            {!loading && filteredPlaces.length === 0 ? (
              <p className="text-sm text-slate-400">No places found.</p>
            ) : null}
            {filteredPlaces.map((place) => {
              const placeLat = place.lat ?? null;
              const placeLng = place.lng ?? null;
              const distance =
                lat !== null &&
                lng !== null &&
                placeLat !== null &&
                placeLng !== null
                  ? formatDistanceMiles(lat, lng, placeLat, placeLng)
                  : null;

              return (
                <button
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
                  key={place.id}
                  onClick={() => openPlace(place)}
                  type="button"
                >
                  <h2 className="font-semibold">{place.name}</h2>
                  <p className="text-sm text-slate-300">
                    {place.category ?? "Uncategorized"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {place.address ?? "No address provided"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {[place.city, place.state].filter(Boolean).join(", ") ||
                      "Unknown location"}
                  </p>
                  {distance ? (
                    <p className="text-xs text-emerald-300">{distance} away</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <PlaceDetailSheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        place={selectedPlace}
      />
    </main>
  );
}
