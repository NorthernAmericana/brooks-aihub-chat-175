export type LaunchPhase = "pre_early_release" | "early_release";

const DEFAULT_EARLY_RELEASE_START_AT = "2026-04-10T05:00:00Z";
const DEFAULT_EARLY_RELEASE_TIMEZONE = "America/Chicago";

function parseDateOrFallback(value: string | undefined, fallbackIso: string): Date {
  if (!value) {
    return new Date(fallbackIso);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(fallbackIso);
  }

  return parsed;
}

export const EARLY_RELEASE_START_AT = parseDateOrFallback(
  process.env.NEXT_PUBLIC_EARLY_RELEASE_START_AT,
  DEFAULT_EARLY_RELEASE_START_AT
);

export const EARLY_RELEASE_TIMEZONE =
  process.env.NEXT_PUBLIC_EARLY_RELEASE_TZ || DEFAULT_EARLY_RELEASE_TIMEZONE;

export const FOUNDERS_PRICE_USD = 4.99;

export const FOUNDERS_STRIPE_PRICE_ID =
  process.env.NEXT_PUBLIC_FOUNDERS_STRIPE_PRICE_ID || "";

export const ENABLE_FUTURE_TIERS =
  process.env.NEXT_PUBLIC_ENABLE_FUTURE_TIERS === "true";

export function getLaunchPhase(now: Date = new Date()): LaunchPhase {
  return now.getTime() >= EARLY_RELEASE_START_AT.getTime()
    ? "early_release"
    : "pre_early_release";
}

export function isEarlyRelease(now: Date = new Date()): boolean {
  return getLaunchPhase(now) === "early_release";
}

export function getCountdownParts(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
} {
  const diffMs = Math.max(0, EARLY_RELEASE_START_AT.getTime() - now.getTime());
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}
