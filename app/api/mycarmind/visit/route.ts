import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { withUserDbContext } from "@/lib/db/request-context";

const POINTS = { visit: 10 };
const LEVEL_STEP_POINTS = 250;
const LEVEL_TITLES = [
  "Road Rookie",
  "City Cruiser",
  "Route Ranger",
  "Highway Hero",
  "Legendary Navigator",
] as const;

const schema = z.object({
  provider: z.string().trim().min(1),
  place_id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  lat: z.coerce.number().nullable().optional(),
  lng: z.coerce.number().nullable().optional(),
  proof_type: z.string().trim().min(1),
});

type StatsRow = {
  points: number;
  visits_count: number;
  missions_completed: number;
};

function buildLevelPayload(points: number, missionsCompleted: number) {
  const level = Math.max(1, Math.floor(points / LEVEL_STEP_POINTS) + 1);
  const pointsToNextLevel = level * LEVEL_STEP_POINTS - points;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return {
    level,
    title,
    title_ready: missionsCompleted >= level,
    points_to_next_level: Math.max(0, pointsToNextLevel),
  };
}

function toStatsPayload(stats: StatsRow) {
  const points = Number(stats.points ?? 0);
  const missionsCompleted = Number(stats.missions_completed ?? 0);

  return {
    points,
    visits_count: Number(stats.visits_count ?? 0),
    missions_completed: missionsCompleted,
    ...buildLevelPayload(points, missionsCompleted),
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = session.user.id;
  const now = new Date();
  const utcDateKey = now.toISOString().slice(0, 10);
  const utcHour = now.getUTCHours();

  const result = await withUserDbContext(userId, async (tx) => {
    const visitRows = await tx.execute<{ id: string; curated_place_id: string | null }>(sql`
      WITH curated AS (
        SELECT id
        FROM mycarmind_places
        WHERE id::text = ${parsed.data.place_id}
           OR LOWER(COALESCE(metadata->'external_ids'->>${parsed.data.provider}, '')) = LOWER(${parsed.data.place_id})
        LIMIT 1
      )
      INSERT INTO mycarmind_visits (
        user_id,
        curated_place_id,
        provider,
        place_ref,
        place_name,
        category,
        city,
        state,
        lat,
        lng,
        proof_type,
        visit_date,
        visited_at
      )
      VALUES (
        ${userId},
        (SELECT id FROM curated),
        ${parsed.data.provider},
        ${parsed.data.place_id},
        ${parsed.data.name},
        ${parsed.data.category},
        ${parsed.data.city},
        ${parsed.data.state},
        ${parsed.data.lat ?? null},
        ${parsed.data.lng ?? null},
        ${parsed.data.proof_type},
        ${utcDateKey},
        now()
      )
      ON CONFLICT (user_id, provider, place_ref, visit_date)
      DO NOTHING
      RETURNING id, curated_place_id;
    `);

    const insertedVisit = visitRows[0];

    if (!insertedVisit) {
      const [existingVisit, existingStats] = await Promise.all([
        tx.execute<{ id: string; curated_place_id: string | null }>(sql`
          SELECT id, curated_place_id
          FROM mycarmind_visits
          WHERE user_id = ${userId}
            AND LOWER(provider) = LOWER(${parsed.data.provider})
            AND LOWER(place_ref) = LOWER(${parsed.data.place_id})
            AND visit_date = ${utcDateKey}
          ORDER BY created_at DESC
          LIMIT 1;
        `),
        tx.execute<StatsRow>(sql`
          SELECT points, visits_count, missions_completed
          FROM mycarmind_user_stats
          WHERE user_id = ${userId}
          LIMIT 1;
        `),
      ]);

      return {
        visit_id: existingVisit[0]?.id ?? null,
        curated_place_id: existingVisit[0]?.curated_place_id ?? null,
        duplicate_visit: true,
        stats: existingStats[0] ?? {
          points: 0,
          visits_count: 0,
          missions_completed: 0,
        },
      };
    }

    await tx.execute(sql`
      INSERT INTO mycarmind_mission_progress (user_id, mission_id, progress_count)
      SELECT ${userId}, m.id, 1
      FROM mycarmind_missions m
      WHERE (m.category IS NULL OR LOWER(m.category) = LOWER(${parsed.data.category}))
        AND (m.city IS NULL OR LOWER(m.city) = LOWER(${parsed.data.city}))
        AND (m.state IS NULL OR LOWER(m.state) = LOWER(${parsed.data.state}))
      ON CONFLICT (user_id, mission_id)
      DO UPDATE SET
        progress_count = mycarmind_mission_progress.progress_count + 1,
        updated_at = now();
    `);

    const newlyCompletedSeasonMissions = await tx.execute<{ points_reward: number }>(sql`
      UPDATE mycarmind_mission_progress mp
      SET completed_at = now(), updated_at = now()
      FROM mycarmind_missions m
      WHERE mp.user_id = ${userId}
        AND mp.mission_id = m.id
        AND mp.completed_at IS NULL
        AND mp.progress_count >= m.target_count
      RETURNING m.points_reward;
    `);

    await tx.execute(sql`
      WITH profile AS (
        SELECT home_city, home_state
        FROM mycarmind_user_profiles
        WHERE user_id = ${userId}
      ),
      eligible AS (
        SELECT dm.slug
        FROM mycarmind_daily_missions dm
        LEFT JOIN profile p ON true
        WHERE dm.date_key = ${utcDateKey}
          AND (LOWER(dm.category) = LOWER(${parsed.data.category}) OR LOWER(dm.category) = 'any')
          AND (
            (dm.window_start_hour <= dm.window_end_hour AND ${utcHour} BETWEEN dm.window_start_hour AND dm.window_end_hour)
            OR (dm.window_start_hour > dm.window_end_hour AND (${utcHour} >= dm.window_start_hour OR ${utcHour} <= dm.window_end_hour))
          )
          AND (
            dm.requires_home_city_match = false
            OR (
              p.home_city IS NOT NULL
              AND p.home_state IS NOT NULL
              AND LOWER(${parsed.data.city}) = LOWER(p.home_city)
              AND LOWER(${parsed.data.state}) = LOWER(p.home_state)
              AND (dm.home_city IS NULL OR LOWER(dm.home_city) = LOWER(p.home_city))
              AND (dm.home_state IS NULL OR LOWER(dm.home_state) = LOWER(p.home_state))
            )
          )
      )
      INSERT INTO mycarmind_daily_mission_progress (user_id, date_key, slug, progress_count)
      SELECT ${userId}, ${utcDateKey}, eligible.slug, 1
      FROM eligible
      ON CONFLICT (user_id, date_key, slug)
      DO UPDATE SET
        progress_count = CASE
          WHEN mycarmind_daily_mission_progress.completed THEN mycarmind_daily_mission_progress.progress_count
          ELSE mycarmind_daily_mission_progress.progress_count + 1
        END,
        updated_at = now();
    `);

    const newlyCompletedDailyMissions = await tx.execute<{ points_reward: number }>(sql`
      UPDATE mycarmind_daily_mission_progress dmp
      SET completed = true, updated_at = now()
      FROM mycarmind_daily_missions dm
      WHERE dmp.user_id = ${userId}
        AND dmp.date_key = ${utcDateKey}
        AND dmp.date_key = dm.date_key
        AND dmp.slug = dm.slug
        AND dmp.completed = false
        AND dmp.progress_count >= dm.required_count
      RETURNING dm.points_reward;
    `);

    const missionRewardPoints =
      newlyCompletedSeasonMissions.reduce(
        (total, row) => total + Number(row.points_reward ?? 0),
        0
      ) +
      newlyCompletedDailyMissions.reduce(
        (total, row) => total + Number(row.points_reward ?? 0),
        0
      );

    const completedMissionCount =
      newlyCompletedSeasonMissions.length + newlyCompletedDailyMissions.length;

    const statsRows = await tx.execute<StatsRow>(sql`
      INSERT INTO mycarmind_user_stats (user_id, points, visits_count, missions_completed)
      VALUES (
        ${userId},
        ${POINTS.visit + missionRewardPoints},
        1,
        ${completedMissionCount}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        points = mycarmind_user_stats.points + ${POINTS.visit + missionRewardPoints},
        visits_count = mycarmind_user_stats.visits_count + 1,
        missions_completed = mycarmind_user_stats.missions_completed + ${completedMissionCount},
        updated_at = now()
      RETURNING points, visits_count, missions_completed;
    `);

    return {
      visit_id: insertedVisit.id,
      curated_place_id: insertedVisit.curated_place_id,
      duplicate_visit: false,
      stats: statsRows[0] ?? {
        points: POINTS.visit + missionRewardPoints,
        visits_count: 1,
        missions_completed: completedMissionCount,
      },
    };
  });

  return NextResponse.json({
    visit_id: result.visit_id,
    curated_place_id: result.curated_place_id,
    duplicate_visit: result.duplicate_visit,
    stats: toStatsPayload(result.stats),
  });
}
