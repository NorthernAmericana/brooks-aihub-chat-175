import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const missions = await db.execute(sql`
    SELECT m.id, m.slug, m.name, m.description, m.city, m.state, m.target_count, m.points_reward,
      COALESCE(p.progress_count, 0) AS progress_count,
      p.completed_at
    FROM mycarmind_missions m
    LEFT JOIN mycarmind_mission_progress p ON p.mission_id = m.id AND p.user_id = ${userId}
    ORDER BY m.points_reward DESC, m.name ASC;
  `);

  return NextResponse.json({ missions });
}
