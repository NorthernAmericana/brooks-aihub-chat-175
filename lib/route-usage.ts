import { normalizeRoute } from "@/lib/ai/routing";

const STORAGE_KEY = "route-usage";

type RouteUsage = Record<string, number>;

export function getRouteUsage(): RouteUsage {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as RouteUsage;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function recordRouteUsage(route: string): RouteUsage {
  if (typeof window === "undefined") {
    return {};
  }

  const normalized = normalizeRoute(route);
  const usage = getRouteUsage();
  usage[normalized] = (usage[normalized] ?? 0) + 1;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

export function getMostUsedRoute(
  usage: RouteUsage,
  exclude: string[] = []
): string | null {
  const excluded = new Set(exclude.map((route) => normalizeRoute(route)));
  const entries = Object.entries(usage).filter(
    ([route]) => !excluded.has(normalizeRoute(route))
  );

  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}
