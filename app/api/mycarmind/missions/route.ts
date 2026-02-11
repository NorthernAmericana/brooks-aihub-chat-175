import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { withUserDbContext } from "@/lib/db/request-context";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    const missions = await db.execute(sql`
      SELECT m.id, m.slug, m.name, m.description, m.city, m.state, m.target_count, m.points_reward,
        0::int AS progress_count,
        NULL::timestamptz AS completed_at
      FROM mycarmind_missions m
      ORDER BY m.points_reward DESC, m.name ASC;
    `);

    return NextResponse.json({ missions });
  }

  const missions = await withUserDbContext(userId, async (tx) => {
    const qtx = tx as { execute: typeof db.execute };
    return qtx.execute(sql`
      SELECT m.id, m.slug, m.name, m.description, m.city, m.state, m.target_count, m.points_reward,
        COALESCE(p.progress_count, 0) AS progress_count,
        p.completed_at
      FROM mycarmind_missions m
      LEFT JOIN mycarmind_mission_progress p ON p.mission_id = m.id AND p.user_id = ${userId}
      ORDER BY m.points_reward DESC, m.name ASC;
    `);
  });

  return NextResponse.json({ missions });
}
