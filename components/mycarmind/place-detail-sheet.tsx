"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Place = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type PlaceDetailSheetProps = {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getMapsQuery(place: Place) {
  if (typeof place.lat === "number" && typeof place.lng === "number") {
    return `${place.lat},${place.lng}`;
  }

  const fallback = [place.name, place.address, place.city, place.state]
    .filter(Boolean)
    .join(" ");
  return fallback || place.name;
}

export function PlaceDetailSheet({
  place,
  open,
  onOpenChange,
}: PlaceDetailSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingVisit, setIsStartingVisit] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const mapsHref = useMemo(() => {
    if (!place) {
      return "#";
    }

    const query = encodeURIComponent(getMapsQuery(place));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [place]);

  if (!open || !place) {
    return null;
  }

  return (
    <div
      aria-label={place.name}
      aria-modal="true"
      className="fixed inset-0 z-50"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <button
        aria-label="Close details"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-5 text-slate-100">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/20" />
        <p className="text-xs uppercase tracking-wide text-emerald-300">
          {place.category ?? "Place"}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{place.name}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {[place.address, [place.city, place.state].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(" · ") || "No address available"}
        </p>
        {place.description ? (
          <p className="mt-3 text-sm text-slate-200">{place.description}</p>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a
            className="rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-black"
            href={mapsHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in Maps
          </a>
          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-sm"
            disabled={isStartingVisit}
            onClick={async () => {
              setIsStartingVisit(true);
              setStatusMessage("Visit queued locally.");

              try {
                const pendingVisits = JSON.parse(
                  localStorage.getItem("mycarmind-pending-visits") ?? "[]"
                ) as Array<{ placeId: string; createdAt: string }>;
                pendingVisits.push({
                  placeId: place.id,
                  createdAt: new Date().toISOString(),
                });
                localStorage.setItem(
                  "mycarmind-pending-visits",
                  JSON.stringify(pendingVisits)
                );
              } catch {
                // localStorage unavailable; continue with remote sync attempt.
              }

              try {
                const response = await fetch("/api/mycarmind/visit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ placeId: place.id }),
                });
                if (response.ok) {
                  setStatusMessage("Visit started and synced.");
                } else {
                  setStatusMessage("Visit queued locally. Sign in to sync.");
                }
              } catch {
                setStatusMessage(
                  "Visit queued locally. We'll sync when online."
                );
              } finally {
                setIsStartingVisit(false);
              }
            }}
            type="button"
          >
            {isStartingVisit ? "Starting..." : "Start Visit"}
          </button>
          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-sm"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                const response = await fetch("/api/mycarmind/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ placeId: place.id }),
                });

                setStatusMessage(
                  response.ok
                    ? "Saved to your places."
                    : "Could not save right now."
                );
              } catch {
                setStatusMessage("Could not save right now.");
              } finally {
                setIsSaving(false);
              }
            }}
            type="button"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {statusMessage ? (
          <p className="mt-4 text-xs text-slate-300">{statusMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
