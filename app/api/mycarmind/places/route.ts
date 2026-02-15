import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() || null;
  const state = searchParams.get("state")?.trim() || null;
  const q = searchParams.get("q")?.trim() || null;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const sort = searchParams.get("sort") || "name";
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const limit = Math.min(Number(searchParams.get("limit") || "100"), 250);

  if (hasCoords && sort === "distance") {
    const places = await db.execute(sql`
      SELECT id, slug, name, description, city, state, address, category, lat, lng
      FROM mycarmind_places
      WHERE (${city}::text IS NULL OR city ILIKE ${city ?? ""})
        AND (${state}::text IS NULL OR state ILIKE ${state ?? ""})
        AND (
          ${q}::text IS NULL OR
          name ILIKE ${`%${q ?? ""}%`} OR
          category ILIKE ${`%${q ?? ""}%`} OR
          city ILIKE ${`%${q ?? ""}%`}
        )
      ORDER BY
        (
          3958.8 * acos(
            cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(lat))
          )
        ) ASC NULLS LAST,
        name ASC
      LIMIT ${limit};
    `);

    return NextResponse.json({ places });
  }

  const places = await db.execute(sql`
    SELECT id, slug, name, description, city, state, address, category, lat, lng
    FROM mycarmind_places
    WHERE (${city}::text IS NULL OR city ILIKE ${city ?? ""})
      AND (${state}::text IS NULL OR state ILIKE ${state ?? ""})
      AND (
        ${q}::text IS NULL OR
        name ILIKE ${`%${q ?? ""}%`} OR
        category ILIKE ${`%${q ?? ""}%`} OR
        city ILIKE ${`%${q ?? ""}%`}
      )
    ORDER BY name ASC
    LIMIT ${limit};
  `);

  return NextResponse.json({ places });
}
