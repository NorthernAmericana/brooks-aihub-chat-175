import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { withUserDbContext } from "@/lib/db/request-context";

type Scope = "global" | "state" | "city";

function normalizeScope(value: string | null): Scope {
  if (value === "city" || value === "state") {
    return value;
  }

  return "global";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));

  let homeCity: string | null = null;
  let homeState: string | null = null;

  if (scope !== "global") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileRows = await withUserDbContext(session.user.id, (tx) =>
      tx.execute<{ home_city: string | null; home_state: string | null }>(sql`
        SELECT home_city, home_state
        FROM mycarmind_user_profiles
        WHERE user_id = ${session.user.id}
        LIMIT 1;
      `)
    );

    homeCity = profileRows[0]?.home_city ?? null;
    homeState = profileRows[0]?.home_state ?? null;

    if (scope === "state" && !homeState) {
      return NextResponse.json({
        scope,
        leaderboard: [],
        missingProfile: "home_state",
      });
    }

    if (scope === "city" && (!homeCity || !homeState)) {
      return NextResponse.json({
        scope,
        leaderboard: [],
        missingProfile: homeCity ? "home_state" : "home_city",
      });
    }
  }

  const where =
    scope === "city"
      ? sql`WHERE profile.home_city ILIKE ${homeCity ?? ""} AND profile.home_state ILIKE ${homeState ?? ""}`
      : scope === "state"
        ? sql`WHERE profile.home_state ILIKE ${homeState ?? ""}`
        : sql``;

  const rows = await db.execute(sql`
    SELECT
      ranked.rank,
      ranked.user_id,
      ranked.display_name,
      ranked.subtitle,
      ranked.points,
      ranked.visits_count,
      ranked.missions_completed
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY stats.points DESC, stats.visits_count DESC, stats.user_id) AS rank,
        stats.user_id,
        COALESCE(profile.nickname, CONCAT('Traveler-', LEFT(stats.user_id::text, 8))) AS display_name,
        CASE
          WHEN COALESCE(profile.show_subtitle, false) THEN profile.subtitle
          ELSE NULL
        END AS subtitle,
        stats.points,
        stats.visits_count,
        stats.missions_completed
      FROM mycarmind_user_stats stats
      LEFT JOIN mycarmind_user_profiles profile ON profile.user_id = stats.user_id
      ${where}
    ) ranked
    ORDER BY ranked.rank ASC
    LIMIT 50;
  `);

  return NextResponse.json({ scope, leaderboard: rows });
}
