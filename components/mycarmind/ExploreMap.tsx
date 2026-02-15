"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Place = {
  id: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
};

type ExploreMapProps = {
  apiKey?: string;
  places: Place[];
  onSelectPlace: (place: Place) => void;
  overlay: ReactNode;
};

declare global {
  interface Window {
    google?: any;
  }
}

export function ExploreMap({ apiKey, places, onSelectPlace, overlay }: ExploreMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [scriptState, setScriptState] = useState<"idle" | "ready" | "error">("idle");

  const mappablePlaces = useMemo(
    () => places.filter((place) => typeof place.lat === "number" && typeof place.lng === "number"),
    [places]
  );

  useEffect(() => {
    if (scriptState !== "ready" || !mapElementRef.current || !window.google?.maps) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapElementRef.current, {
        center: { lat: 39.5, lng: -98.35 },
        zoom: 4,
        disableDefaultUI: true,
        zoomControl: true,
      });
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    mappablePlaces.forEach((place) => {
      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position: { lat: place.lat as number, lng: place.lng as number },
        title: place.name,
      });

      marker.addListener("click", () => onSelectPlace(place));
      markersRef.current.push(marker);
      bounds.extend({ lat: place.lat as number, lng: place.lng as number });
    });

    if (mappablePlaces.length > 1) {
      mapRef.current.fitBounds(bounds, 64);
    } else if (mappablePlaces.length === 1) {
      mapRef.current.setCenter({
        lat: mappablePlaces[0].lat as number,
        lng: mappablePlaces[0].lng as number,
      });
      mapRef.current.setZoom(13);
    }
  }, [mappablePlaces, onSelectPlace, scriptState]);

  const showFallback = !apiKey || scriptState === "error";

  return (
    <div className="fixed inset-0 bg-slate-950">
      {apiKey ? (
        <Script
          onError={() => setScriptState("error")}
          onLoad={() => setScriptState("ready")}
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
          strategy="afterInteractive"
        />
      ) : null}

      <div className="absolute inset-0" ref={mapElementRef} />

      {showFallback ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 w-[90%] max-w-xl -translate-x-1/2 rounded-xl border border-amber-300/40 bg-black/70 p-3 text-sm text-amber-100">
          Map unavailable (missing key or failed to load). List mode remains fully usable.
        </div>
      ) : null}

      {!showFallback && scriptState !== "ready" ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-slate-200">
          Loading map...
        </div>
      ) : null}

      <div className="absolute inset-x-0 top-0 z-30">{overlay}</div>
    </div>
  );
}
