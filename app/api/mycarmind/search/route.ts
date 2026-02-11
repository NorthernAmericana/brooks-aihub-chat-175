import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ curated: [], vector: [], enriched: [] });
  }

  const curated = await db.execute(sql`
    SELECT id, slug, name, description, city, state, category, lat, lng
    FROM mycarmind_places
    WHERE name ILIKE ${`%${q}%`} OR description ILIKE ${`%${q}%`} OR category ILIKE ${`%${q}%`}
    ORDER BY name ASC
    LIMIT 20;
  `);

  const vector = await db.execute(sql`
    SELECT p.id, p.slug, p.name, p.description, p.city, p.state, p.category
    FROM mycarmind_places p
    JOIN mycarmind_place_embeddings e ON e.place_id = p.id
    WHERE p.name ILIKE ${`%${q}%`}
    LIMIT 10;
  `);

  const enriched: Array<{ note: string; citation_url: string }> = [];
  if (curated.length < 3) {
    enriched.push({
      note: "No additional web enrichment executed in MVP mode. Use curated citations for now.",
      citation_url: "https://www.visitpensacola.com/",
    });
  }

  return NextResponse.json({ curated, vector, enriched });
}
