import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { withUserDbContext } from "@/lib/db/request-context";

const POINTS = { visit: 10, mission: 100, cityBadge: 250 };

const schema = z.object({
  placeId: z.string().uuid(),
  note: z.string().max(500).optional(),
  mediaAssetId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const visitId = await withUserDbContext(session.user.id, async (tx) => {
    const qtx = tx as { execute: typeof db.execute };
    const visit = await qtx.execute<{ id: string }>(sql`
      INSERT INTO mycarmind_place_visits (user_id, place_id, note, media_asset_id)
      VALUES (${session.user.id}, ${parsed.data.placeId}, ${parsed.data.note ?? null}, ${parsed.data.mediaAssetId ?? null})
      RETURNING id;
    `);

    await qtx.execute(sql`
      INSERT INTO mycarmind_user_stats (user_id, points, visits_count)
      VALUES (${session.user.id}, ${POINTS.visit}, 1)
      ON CONFLICT (user_id)
      DO UPDATE SET
        points = mycarmind_user_stats.points + ${POINTS.visit},
        visits_count = mycarmind_user_stats.visits_count + 1,
        updated_at = now();
    `);

    await qtx.execute(sql`
      WITH candidate AS (
        SELECT id, target_count, points_reward
        FROM mycarmind_missions
        WHERE city = (SELECT city FROM mycarmind_places WHERE id = ${parsed.data.placeId})
        LIMIT 1
      )
      INSERT INTO mycarmind_mission_progress (user_id, mission_id, progress_count)
      SELECT ${session.user.id}, candidate.id, 1 FROM candidate
      ON CONFLICT (user_id, mission_id)
      DO UPDATE SET progress_count = mycarmind_mission_progress.progress_count + 1, updated_at = now();
    `);

    return visit[0]?.id ?? null;
  });

  return NextResponse.json({ visitId, points: POINTS });
}
