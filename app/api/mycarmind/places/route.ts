import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() ?? null;
  const state = searchParams.get("state")?.trim() ?? null;

  const places = await db.execute(sql`
    SELECT id, slug, name, description, city, state, category, lat, lng
    FROM mycarmind_places
    WHERE (${city}::text IS NULL OR city ILIKE ${city ?? ""})
      AND (${state}::text IS NULL OR state ILIKE ${state ?? ""})
    ORDER BY name ASC
    LIMIT 250;
  `);

  return NextResponse.json({ places });
}
