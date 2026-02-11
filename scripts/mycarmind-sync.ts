import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

config({ path: ".env.local" });

type PlaceSource = { url: string; title?: string };
type PlaceRecord = {
  slug: string;
  name: string;
  description?: string;
  city: string;
  state: string;
  category: string;
  lat?: number;
  lng?: number;
  sources?: PlaceSource[];
};

type MissionRecord = {
  slug: string;
  name: string;
  description?: string;
  city?: string;
  state?: string;
  category?: string;
  targetCount?: number;
  pointsReward?: number;
};

const BASE_DIR = path.join(process.cwd(), "data/mycarmind/season-1/us");

async function run() {
  const placesPath = path.join(BASE_DIR, "florida/pensacola/places.json");
  const missionsPath = path.join(BASE_DIR, "florida/pensacola/missions.json");

  const places = JSON.parse(await readFile(placesPath, "utf-8")) as PlaceRecord[];
  const missions = JSON.parse(await readFile(missionsPath, "utf-8")) as MissionRecord[];

  for (const place of places) {
    const inserted = await db.execute<{ id: string }>(sql`
      INSERT INTO mycarmind_places (slug, name, description, city, state, category, lat, lng, source_type)
      VALUES (${place.slug}, ${place.name}, ${place.description ?? null}, ${place.city}, ${place.state}, ${place.category}, ${place.lat ?? null}, ${place.lng ?? null}, 'registry')
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        category = EXCLUDED.category,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        updated_at = now()
      RETURNING id;
    `);

    const placeId = inserted[0]?.id;
    if (!placeId) continue;

    for (const source of place.sources ?? []) {
      await db.execute(sql`
        INSERT INTO mycarmind_place_sources (place_id, source_kind, citation_url, citation_title)
        VALUES (${placeId}, 'registry', ${source.url}, ${source.title ?? null})
        ON CONFLICT DO NOTHING;
      `);
    }
  }

  for (const mission of missions) {
    await db.execute(sql`
      INSERT INTO mycarmind_missions (slug, name, description, city, state, category, target_count, points_reward, season)
      VALUES (${mission.slug}, ${mission.name}, ${mission.description ?? null}, ${mission.city ?? null}, ${mission.state ?? null}, ${mission.category ?? null}, ${mission.targetCount ?? 1}, ${mission.pointsReward ?? 100}, 'season-1')
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        category = EXCLUDED.category,
        target_count = EXCLUDED.target_count,
        points_reward = EXCLUDED.points_reward,
        updated_at = now();
    `);
  }

  console.log(`Synced ${places.length} places and ${missions.length} missions.`);
}

run().catch((error) => {
  console.error("mycarmind sync failed", error);
  process.exit(1);
});
