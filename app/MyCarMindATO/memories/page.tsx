"use client";

import { ArrowLeft, Car, Home, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { useProfileIcon } from "@/hooks/use-profile-icon";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants";
import { fetcher } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

type HomeLocation = {
  rawText: string;
  normalizedText?: string | null;
  updatedAt?: string | null;
};

type VehicleSelection = {
  make: string;
  model: string;
  year?: number | null;
  updatedAt?: string | null;
};

type HomeLocationResponse = {
  homeLocation: HomeLocation | null;
};

type VehicleResponse = {
  vehicle: VehicleSelection | null;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export default function MyCarMindATOMemoriesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { profileIcon } = useProfileIcon();
  const { data: homeLocationData, error: homeLocationError } =
    useSWR<HomeLocationResponse>("/api/mycarmindato/home-location", fetcher);
  const { data: vehicleData, error: vehicleError } =
    useSWR<VehicleResponse>("/api/mycarmindato/vehicle", fetcher);

  const avatarSrc = profileIcon ?? session?.user?.image ?? DEFAULT_AVATAR_SRC;
  const homeLocation = homeLocationData?.homeLocation ?? null;
  const vehicle = vehicleData?.vehicle ?? null;

  const vehicleLabel = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
    : "No vehicle saved yet.";

  return (
    <div className="app-page-overlay fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0d1620] via-[#0f1c27] to-[#0b151d]">
      <div className="app-page-header sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0b151d]/90 px-4 py-3 backdrop-blur-sm">
        <button
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            <ImageWithFallback
              alt="MyCarMindATO icon"
              className="h-full w-full object-cover"
              containerClassName="size-full"
              height={36}
              src="/icons/mycarmindato-appicon.png"
              width={36}
            />
          </div>
          <div>
            <h1 className="font-pixel text-lg text-white">
              MyCarMindATO Memories
            </h1>
            <p className="text-xs text-white/60">
              Personal /MyCarMindATO/ scope
            </p>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          <ImageWithFallback
            alt="Profile avatar"
            className="h-full w-full object-cover"
            containerClassName="size-full"
            height={40}
            src={avatarSrc}
            width={40}
          />
        </div>
      </div>

      <div className="app-page-content flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Personal memories
          </p>
          <h2 className="mt-2 text-xl font-semibold">MyCarMindATO-only data</h2>
          <p className="mt-2 text-sm text-white/70">
            These memories are scoped to the /MyCarMindATO/ route only. They are
            not shared with global Brooks AI HUB memories or other agents.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                <Home className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Home location</h3>
                <p className="text-xs text-white/60">
                  From /api/mycarmindato/home-location
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {homeLocationError && (
                <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  Unable to load home location.
                </p>
              )}
              {!homeLocationError && !homeLocationData && (
                <p>Loading home location…</p>
              )}
              {homeLocationData && (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-emerald-200" />
                    <span>
                      {homeLocation
                        ? homeLocation.normalizedText ||
                          homeLocation.rawText ||
                          "Saved without a label."
                        : "No home location saved yet."}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Updated {formatTimestamp(homeLocation?.updatedAt)}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-400/20 text-blue-200">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Vehicle selection</h3>
                <p className="text-xs text-white/60">
                  From /api/mycarmindato/vehicle
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {vehicleError && (
                <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  Unable to load vehicle selection.
                </p>
              )}
              {!vehicleError && !vehicleData && <p>Loading vehicle…</p>}
              {vehicleData && (
                <>
                  <p>{vehicleLabel}</p>
                  <p className="text-xs text-white/50">
                    Updated {formatTimestamp(vehicle?.updatedAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
