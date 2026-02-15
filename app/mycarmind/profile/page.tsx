"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = {
  nickname: string | null;
  home_city: string | null;
  home_state: string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
  subtitle: string | null;
  show_subtitle: boolean;
  hands_free_mode: boolean;
};

const EMPTY_PROFILE: Profile = {
  nickname: "",
  home_city: "",
  home_state: "",
  car_make: "",
  car_model: "",
  car_year: null,
  subtitle: "",
  show_subtitle: false,
  hands_free_mode: false,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/mycarmind/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!active) {
          return;
        }

        setProfile({
          nickname: data.profile?.nickname ?? "",
          home_city: data.profile?.home_city ?? "",
          home_state: data.profile?.home_state ?? "",
          car_make: data.profile?.car_make ?? "",
          car_model: data.profile?.car_model ?? "",
          car_year: data.profile?.car_year ?? null,
          subtitle: data.profile?.subtitle ?? "",
          show_subtitle: Boolean(data.profile?.show_subtitle),
          hands_free_mode: Boolean(data.profile?.hands_free_mode),
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/mycarmind/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Unable to save profile.");
      setSaving(false);
      return;
    }

    setProfile((current) => ({
      ...current,
      ...data.profile,
      car_year: data.profile?.car_year ?? null,
      show_subtitle: Boolean(data.profile?.show_subtitle),
      hands_free_mode: Boolean(data.profile?.hands_free_mode),
    }));
    setStatus("Profile saved.");
    setSaving(false);
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-slate-300">
          Edit your public leaderboard identity, home location, and vehicle.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-lg border border-emerald-400/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10"
            href="/mycarmind/garage"
          >
            Open Garage
          </Link>
          <Link
            className="rounded-lg border border-sky-400/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10"
            href="/mycarmind/agent-settings"
          >
            Agent Settings
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-300">Loading profile…</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nickname"
                onChange={(value) => updateField("nickname", value)}
                value={profile.nickname ?? ""}
              />
              <Input
                label="Subtitle"
                onChange={(value) => updateField("subtitle", value)}
                value={profile.subtitle ?? ""}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Home City"
                onChange={(value) => updateField("home_city", value)}
                value={profile.home_city ?? ""}
              />
              <Input
                label="Home State"
                onChange={(value) => updateField("home_state", value)}
                value={profile.home_state ?? ""}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Vehicle Make"
                onChange={(value) => updateField("car_make", value)}
                value={profile.car_make ?? ""}
              />
              <Input
                label="Vehicle Model"
                onChange={(value) => updateField("car_model", value)}
                value={profile.car_model ?? ""}
              />
              <Input
                label="Vehicle Year"
                onChange={(value) =>
                  updateField(
                    "car_year",
                    value ? Number.parseInt(value, 10) : null
                  )
                }
                value={profile.car_year?.toString() ?? ""}
              />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span>Show subtitle on leaderboard</span>
              <input
                checked={profile.show_subtitle}
                className="h-4 w-4"
                onChange={(event) =>
                  updateField("show_subtitle", event.target.checked)
                }
                type="checkbox"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span>Hands-free mode</span>
              <input
                checked={profile.hands_free_mode}
                className="h-4 w-4"
                onChange={(event) =>
                  updateField("hands_free_mode", event.target.checked)
                }
                type="checkbox"
              />
            </label>

            <button
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
              onClick={saveProfile}
              type="button"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {status ? <p className="text-sm text-slate-300">{status}</p> : null}
          </div>
        )}
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-300">{label}</span>
      <input
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-slate-100 outline-none ring-emerald-400 focus:ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
