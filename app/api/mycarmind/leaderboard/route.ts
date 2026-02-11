import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "global";
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  const where =
    scope === "city"
      ? sql`WHERE profile.home_city ILIKE ${city ?? ""} AND profile.home_state ILIKE ${state ?? ""}`
      : scope === "state"
        ? sql`WHERE profile.home_state ILIKE ${state ?? ""}`
        : sql``;

  const rows = await db.execute(sql`
    SELECT stats.user_id, COALESCE(profile.nickname, u.email) AS display_name, stats.points, stats.visits_count, stats.missions_completed
    FROM mycarmind_user_stats stats
    JOIN "User" u ON u.id = stats.user_id
    LEFT JOIN mycarmind_user_profiles profile ON profile.user_id = stats.user_id
    ${where}
    ORDER BY stats.points DESC
    LIMIT 50;
  `);

  return NextResponse.json({ scope, leaderboard: rows });
}
