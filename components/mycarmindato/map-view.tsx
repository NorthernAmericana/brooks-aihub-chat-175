"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

type MapViewProps = {
  query: string;
  className?: string;
  containerClassName?: string;
  ariaLabel?: string;
};

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;
const FOCUSED_ZOOM = 12;

const getGoogleMaps = () =>
  (window as typeof window & { google?: any }).google ?? null;

export default function MapView({
  query,
  className,
  containerClassName,
  ariaLabel = "MyCarMindATO map view",
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!isApiReady || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    const googleMaps = getGoogleMaps();
    if (!googleMaps?.maps) {
      setLoadError("Google Maps failed to initialize.");
      return;
    }

    mapInstanceRef.current = new googleMaps.maps.Map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      disableDefaultUI: false,
      gestureHandling: "greedy",
    });

    geocoderRef.current = new googleMaps.maps.Geocoder();
  }, [isApiReady]);

  useEffect(() => {
    if (!isApiReady || !mapQuery) {
      return;
    }

    const googleMaps = getGoogleMaps();
    const mapInstance = mapInstanceRef.current;
    const geocoder = geocoderRef.current;

    if (!googleMaps?.maps || !mapInstance || !geocoder) {
      return;
    }

    geocoder.geocode({ address: mapQuery }, (results: any, status: string) => {
      if (status !== "OK" || !results?.length) {
        return;
      }

      const location = results[0].geometry.location;
      mapInstance.panTo(location);
      mapInstance.setZoom(FOCUSED_ZOOM);

      if (!markerRef.current) {
        markerRef.current = new googleMaps.maps.Marker({
          map: mapInstance,
          position: location,
        });
      } else {
        markerRef.current.setPosition(location);
      }
    });
  }, [isApiReady, mapQuery]);

  if (!apiKey) {
    return (
      <div
        className={containerClassName}
        role="img"
        aria-label={`${ariaLabel} (missing API key)`}
      >
        <div className="flex h-full items-center justify-center rounded-3xl border border-white/10 bg-black/40 text-sm text-white/70">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live map.
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        onLoad={() => {
          setIsApiReady(true);
          setLoadError(null);
        }}
        onError={() =>
          setLoadError("Unable to load Google Maps. Please try again later.")
        }
        strategy="afterInteractive"
      />
      <div
        aria-label={ariaLabel}
        className={className}
        ref={mapContainerRef}
        role="application"
      />
      {loadError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl border border-white/10 bg-black/70 text-sm text-white">
          {loadError}
        </div>
      )}
    </div>
  );
}
