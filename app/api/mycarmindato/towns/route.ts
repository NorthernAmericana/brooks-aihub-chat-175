import { readFile } from "node:fs/promises";
import path from "node:path";

import { US_STATE_NAMES, US_STATE_NAME_BY_ABBR } from "@/lib/constants/us-states";

type CityRecord = {
  city?: string;
  sub_areas?: Array<{ name?: string }>;
  identity_vibe_tags?: string[];
  community_vibe?: string;
  anchors?: string[];
};

type TownSummary = {
  id: string;
  city: string;
  cityName: string;
  stateName: string;
  subAreas: string[];
  vibes: string[];
  anchors: string[];
  communityVibe?: string;
};

type TownGroup = {
  stateName: string;
  towns: TownSummary[];
};

const CITIES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "season-1-cities.json"
);

let cachedTownSummaries: TownSummary[] | null = null;
let cachedGroupedTowns: TownGroup[] | null = null;

const normalizeCityId = (city: string) =>
  city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const resolveStateName = (rawState: string) => {
  const trimmed = rawState.trim();
  if (!trimmed) {
    return "Unknown";
  }
  const normalized = trimmed.toLowerCase();
  const match = US_STATE_NAMES.find(
    (state) => state.toLowerCase() === normalized
  );
  if (match) {
    return match;
  }
  const abbr = trimmed.toUpperCase();
  return US_STATE_NAME_BY_ABBR[abbr] ?? trimmed;
};

const parseCityState = (city: string) => {
  const parts = city.split(",").map((part) => part.trim());
  if (parts.length === 1) {
    return { cityName: city.trim(), stateName: "Unknown" };
  }
  const stateToken = parts.pop() ?? "";
  const cityName = parts.join(", ").trim() || city.trim();
  return { cityName, stateName: resolveStateName(stateToken) };
};

const buildGroupedTowns = (towns: TownSummary[]): TownGroup[] => {
  const grouped = new Map<string, TownSummary[]>();
  for (const town of towns) {
    const stateName = town.stateName || "Unknown";
    const bucket = grouped.get(stateName);
    if (bucket) {
      bucket.push(town);
    } else {
      grouped.set(stateName, [town]);
    }
  }

  for (const group of grouped.values()) {
    group.sort((a, b) => a.cityName.localeCompare(b.cityName));
  }

  const stateOrder = new Map<string, number>(
    US_STATE_NAMES.map((state, index) => [state, index])
  );

  return Array.from(grouped.entries())
    .sort(([stateA], [stateB]) => {
      const orderA = stateOrder.get(stateA);
      const orderB = stateOrder.get(stateB);
      if (orderA !== undefined || orderB !== undefined) {
        return (orderA ?? Number.POSITIVE_INFINITY) -
          (orderB ?? Number.POSITIVE_INFINITY);
      }
      return stateA.localeCompare(stateB);
    })
    .map(([stateName, towns]) => ({
      stateName,
      towns,
    }));
};

const loadTownData = async (): Promise<{
  towns: TownSummary[];
  groupedTowns: TownGroup[];
}> => {
  if (cachedTownSummaries && cachedGroupedTowns) {
    return { towns: cachedTownSummaries, groupedTowns: cachedGroupedTowns };
  }

  const fileContents = await readFile(CITIES_FILE_PATH, "utf8");
  const parsed = JSON.parse(fileContents) as CityRecord[];
  const summaries: TownSummary[] = [];
  const seen = new Set<string>();

  for (const city of parsed) {
    const name = city.city?.trim();
    if (!name) {
      continue;
    }

    const id = normalizeCityId(name);
    if (!id || seen.has(id)) {
      continue;
    }

    const { cityName, stateName } = parseCityState(name);
    const subAreas =
      city.sub_areas
        ?.map((area) => area.name)
        .filter((value): value is string => Boolean(value)) ?? [];
    const vibes =
      city.identity_vibe_tags?.filter(
        (value): value is string => Boolean(value)
      ) ?? [];
    const anchors =
      city.anchors?.filter((value): value is string => Boolean(value)) ?? [];

    summaries.push({
      id,
      city: name,
      cityName,
      stateName,
      subAreas,
      vibes,
      anchors,
      communityVibe: city.community_vibe?.trim() || undefined,
    });
    seen.add(id);
  }

  summaries.sort((a, b) => a.city.localeCompare(b.city));
  cachedTownSummaries = summaries;
  cachedGroupedTowns = buildGroupedTowns(summaries);
  return { towns: summaries, groupedTowns: cachedGroupedTowns };
};

export async function GET() {
  const { towns, groupedTowns } = await loadTownData();
  return Response.json({ count: towns.length, towns, groupedTowns });
}
