import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const placeRows = await db.execute(sql`
    SELECT id, slug, name, description, city, state, category, lat, lng
    FROM mycarmind_places
    WHERE id = ${id}
    LIMIT 1;
  `);

  const place = placeRows[0];
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const [sources, missions] = await Promise.all([
    db.execute(sql`
      SELECT source_kind, citation_url, citation_title, citation_publisher, citation_note
      FROM mycarmind_place_sources
      WHERE place_id = ${id}
      ORDER BY created_at DESC;
    `),
    db.execute(sql`
      SELECT id, slug, name, description, target_count, points_reward
      FROM mycarmind_missions
      WHERE (city = ${place.city} OR city IS NULL)
        AND (state = ${place.state} OR state IS NULL)
      ORDER BY points_reward DESC
      LIMIT 10;
    `),
  ]);

  return NextResponse.json({ place, sources, missions });
}
