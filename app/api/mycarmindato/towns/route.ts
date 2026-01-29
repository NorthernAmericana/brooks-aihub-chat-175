import { readFile } from "node:fs/promises";
import path from "node:path";

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
  subAreas: string[];
  vibes: string[];
  anchors: string[];
  communityVibe?: string;
};

const CITIES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "season-1-cities.json"
);

let cachedTownSummaries: TownSummary[] | null = null;

const normalizeCityId = (city: string) =>
  city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const loadTownSummaries = async (): Promise<TownSummary[]> => {
  if (cachedTownSummaries) {
    return cachedTownSummaries;
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
      subAreas,
      vibes,
      anchors,
      communityVibe: city.community_vibe?.trim() || undefined,
    });
    seen.add(id);
  }

  summaries.sort((a, b) => a.city.localeCompare(b.city));
  cachedTownSummaries = summaries;
  return summaries;
};

export async function GET() {
  const towns = await loadTownSummaries();
  return Response.json({ count: towns.length, towns });
}
