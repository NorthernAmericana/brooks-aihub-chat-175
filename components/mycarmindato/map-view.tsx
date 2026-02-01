"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

type PinnedLocation = {
  id: string;
  city: string;
  cityName: string;
};

type MapViewProps = {
  query: string;
  className?: string;
  containerClassName?: string;
  ariaLabel?: string;
  onReady?: () => void;
  pinnedTowns?: PinnedLocation[];
  homeLocation?: string | null;
  currentLocation?: { lat: number; lng: number } | null;
  isSyncing?: boolean;
  isLiveTracking?: boolean;
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
  onReady,
  pinnedTowns = [],
  homeLocation = null,
  currentLocation = null,
  isSyncing = false,
  isLiveTracking = false,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pinnedMarkersRef = useRef<any[]>([]);
  const homeMarkerRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
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

  // Effect for pinned towns markers (using Advanced Markers API)
  useEffect(() => {
    if (!isApiReady || !pinnedTowns.length) {
      return;
    }

    const googleMaps = getGoogleMaps();
    const mapInstance = mapInstanceRef.current;
    const geocoder = geocoderRef.current;

    if (!googleMaps?.maps || !mapInstance || !geocoder) {
      return;
    }

    // Clear existing pinned markers
    pinnedMarkersRef.current.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    pinnedMarkersRef.current = [];

    // Create markers for each pinned town
    pinnedTowns.forEach((town) => {
      geocoder.geocode({ address: town.city }, (results: any, status: string) => {
        if (status !== "OK" || !results?.length) {
          return;
        }

        const location = results[0].geometry.location;
        
        // Use Advanced Markers if available, fallback to regular markers
        if (googleMaps.maps.marker?.AdvancedMarkerElement) {
          const content = document.createElement("div");
          content.className = "relative flex h-8 w-8 items-center justify-center";
          content.innerHTML = `
            <div class="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping"></div>
            <div class="relative rounded-full bg-emerald-400 p-2 shadow-lg">
              <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `;
          
          const marker = new googleMaps.maps.marker.AdvancedMarkerElement({
            map: mapInstance,
            position: location,
            content,
            title: town.cityName,
          });
          pinnedMarkersRef.current.push(marker);
        } else {
          // Fallback to regular markers
          const marker = new googleMaps.maps.Marker({
            map: mapInstance,
            position: location,
            title: town.cityName,
            icon: {
              path: googleMaps.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#34d399",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          pinnedMarkersRef.current.push(marker);
        }
      });
    });
  }, [isApiReady, pinnedTowns]);

  // Effect for home location marker
  useEffect(() => {
    if (!isApiReady || !homeLocation) {
      // Clear home marker if no home location
      if (homeMarkerRef.current) {
        if (homeMarkerRef.current.setMap) {
          homeMarkerRef.current.setMap(null);
        }
        homeMarkerRef.current = null;
      }
      return;
    }

    const googleMaps = getGoogleMaps();
    const mapInstance = mapInstanceRef.current;
    const geocoder = geocoderRef.current;

    if (!googleMaps?.maps || !mapInstance || !geocoder) {
      return;
    }

    geocoder.geocode({ address: homeLocation }, (results: any, status: string) => {
      if (status !== "OK" || !results?.length) {
        return;
      }

      const location = results[0].geometry.location;

      // Clear existing home marker
      if (homeMarkerRef.current) {
        if (homeMarkerRef.current.setMap) {
          homeMarkerRef.current.setMap(null);
        }
      }

      // Create home marker with distinct icon
      if (googleMaps.maps.marker?.AdvancedMarkerElement) {
        const content = document.createElement("div");
        content.className = "relative flex h-8 w-8 items-center justify-center";
        content.innerHTML = `
          <div class="relative rounded-full bg-blue-500 p-2 shadow-lg">
            <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;
        
        homeMarkerRef.current = new googleMaps.maps.marker.AdvancedMarkerElement({
          map: mapInstance,
          position: location,
          content,
          title: "Home Location",
        });
      } else {
        homeMarkerRef.current = new googleMaps.maps.Marker({
          map: mapInstance,
          position: location,
          title: "Home Location",
          icon: {
            path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
            scale: 1.5,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
      }
    });
  }, [isApiReady, homeLocation]);

  // Effect for current location marker
  useEffect(() => {
    if (!isApiReady || !currentLocation) {
      // Clear current location marker if not tracking
      if (currentLocationMarkerRef.current) {
        if (currentLocationMarkerRef.current.setMap) {
          currentLocationMarkerRef.current.setMap(null);
        }
        currentLocationMarkerRef.current = null;
      }
      return;
    }

    const googleMaps = getGoogleMaps();
    const mapInstance = mapInstanceRef.current;

    if (!googleMaps?.maps || !mapInstance) {
      return;
    }

    const location = new googleMaps.maps.LatLng(
      currentLocation.lat,
      currentLocation.lng
    );

    // Clear existing current location marker
    if (currentLocationMarkerRef.current) {
      if (currentLocationMarkerRef.current.setMap) {
        currentLocationMarkerRef.current.setMap(null);
      }
    }

    // Create current location marker with pulsing animation
    if (googleMaps.maps.marker?.AdvancedMarkerElement) {
      const content = document.createElement("div");
      content.className = "relative flex h-6 w-6 items-center justify-center";
      content.innerHTML = `
        <div class="absolute inset-0 rounded-full bg-red-500 opacity-25 ${isLiveTracking ? 'animate-ping' : ''}"></div>
        <div class="relative rounded-full bg-red-500 p-1.5 shadow-lg ring-2 ring-white">
          <div class="h-2 w-2 rounded-full bg-white"></div>
        </div>
      `;
      
      currentLocationMarkerRef.current = new googleMaps.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: location,
        content,
        title: "Your Location",
      });
    } else {
      currentLocationMarkerRef.current = new googleMaps.maps.Marker({
        map: mapInstance,
        position: location,
        title: "Your Location",
        icon: {
          path: googleMaps.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
    }
  }, [isApiReady, currentLocation, isLiveTracking]);

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
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`}
        onLoad={() => {
          setIsApiReady(true);
          setLoadError(null);
          onReady?.();
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
      {isSyncing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/70 px-6 py-3 text-white">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm font-medium">Syncing town data...</span>
          </div>
        </div>
      )}
      {loadError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl border border-white/10 bg-black/70 text-sm text-white">
          {loadError}
        </div>
      )}
    </div>
  );
}
