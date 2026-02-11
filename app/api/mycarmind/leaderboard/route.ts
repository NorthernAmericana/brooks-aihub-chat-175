import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "global";
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  let where = sql``;
  if (scope === "city") {
    where = sql`WHERE profile.home_city ILIKE ${city ?? ""} AND profile.home_state ILIKE ${state ?? ""}`;
  } else if (scope === "state") {
    where = sql`WHERE profile.home_state ILIKE ${state ?? ""}`;
  }

  const rows = await db.execute(sql`
    SELECT
      stats.user_id,
      COALESCE(profile.nickname, CONCAT('Traveler-', LEFT(stats.user_id::text, 8))) AS display_name,
      stats.points,
      stats.visits_count,
      stats.missions_completed
    FROM mycarmind_user_stats stats
    LEFT JOIN mycarmind_user_profiles profile ON profile.user_id = stats.user_id
    ${where}
    ORDER BY stats.points DESC
    LIMIT 50;
  `);

  return NextResponse.json({ scope, leaderboard: rows });
}
