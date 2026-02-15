import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { withUserDbContext } from "@/lib/db/request-context";

type DailyMissionSeed = {
  slug: string;
  title: string;
  description: string;
  category: string;
  requiredCount: number;
  windowStartHour: number;
  windowEndHour: number;
  pointsReward: number;
};

const DAILY_MISSION_POOL: DailyMissionSeed[] = [
  {
    slug: "turn-signal-star",
    title: "Turn Signal Star",
    description:
      "Use your blinker before 3 turns so everyone can predict your plot twists.",
    category: "safe-driving",
    requiredCount: 3,
    windowStartHour: 6,
    windowEndHour: 23,
    pointsReward: 90,
  },
  {
    slug: "park-place-finish",
    title: "Park Place Finish",
    description: "Nail 2 smooth parking jobs without touching the drama lines.",
    category: "parking",
    requiredCount: 2,
    windowStartHour: 6,
    windowEndHour: 23,
    pointsReward: 110,
  },
  {
    slug: "brake-it-easy",
    title: "Brake It Easy",
    description:
      "Complete 5 gentle stops and keep the coffee where it belongs.",
    category: "comfort",
    requiredCount: 5,
    windowStartHour: 6,
    windowEndHour: 23,
    pointsReward: 120,
  },
  {
    slug: "lane-ranger",
    title: "Lane Ranger",
    description:
      "Hold perfect lane discipline for 4 segments like the road sheriff.",
    category: "safe-driving",
    requiredCount: 4,
    windowStartHour: 5,
    windowEndHour: 23,
    pointsReward: 100,
  },
  {
    slug: "eco-idle-hands",
    title: "Eco Idle Hands",
    description:
      "Avoid unnecessary idling in 3 moments and let the engine zen out.",
    category: "efficiency",
    requiredCount: 3,
    windowStartHour: 6,
    windowEndHour: 22,
    pointsReward: 95,
  },
  {
    slug: "mirror-mirror",
    title: "Mirror, Mirror",
    description:
      "Do 4 mirror checks before merges so surprises stay in fairy tales.",
    category: "awareness",
    requiredCount: 4,
    windowStartHour: 6,
    windowEndHour: 23,
    pointsReward: 105,
  },
  {
    slug: "steady-pedal",
    title: "Steady Pedal Medal",
    description:
      "Keep acceleration smooth for 4 stretches and earn calm-driver glory.",
    category: "comfort",
    requiredCount: 4,
    windowStartHour: 6,
    windowEndHour: 23,
    pointsReward: 115,
  },
  {
    slug: "curb-your-enthusiasm",
    title: "Curb Your Enthusiasm",
    description:
      "Complete 3 curb-safe maneuvers with wheels and ego fully intact.",
    category: "parking",
    requiredCount: 3,
    windowStartHour: 7,
    windowEndHour: 22,
    pointsReward: 100,
  },
];

function hashDateKey(dateKey: string) {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildDailyMissions(dateKey: string) {
  const hash = hashDateKey(dateKey);
  const missionCount = 3 + (hash % 3);
  const start = hash % DAILY_MISSION_POOL.length;

  return Array.from({ length: missionCount }, (_, offset) => {
    return DAILY_MISSION_POOL[(start + offset) % DAILY_MISSION_POOL.length];
  });
}

async function ensureTodaysMissions(dateKey: string) {
  const existingRows = await db.execute(sql`
    SELECT slug
    FROM mycarmind_daily_missions
    WHERE date_key = ${dateKey}
    LIMIT 1;
  `);

  if (existingRows.length > 0) {
    return;
  }

  const seeds = buildDailyMissions(dateKey);
  await db.execute(sql`
    INSERT INTO mycarmind_daily_missions (date_key, slug, title, description, category, required_count, window_start_hour, window_end_hour, points_reward)
    VALUES ${sql.join(
      seeds.map(
        (mission) => sql`(
        ${dateKey},
        ${mission.slug},
        ${mission.title},
        ${mission.description},
        ${mission.category},
        ${mission.requiredCount},
        ${mission.windowStartHour},
        ${mission.windowEndHour},
        ${mission.pointsReward}
      )`
      ),
      sql`,`
    )}
    ON CONFLICT (date_key, slug) DO NOTHING;
  `);
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const dateKey = new Date().toISOString().slice(0, 10);

  await ensureTodaysMissions(dateKey);

  const todayMissions = await db.execute(sql`
    SELECT date_key, slug, title, description, category, required_count, window_start_hour, window_end_hour, points_reward
    FROM mycarmind_daily_missions
    WHERE date_key = ${dateKey}
    ORDER BY points_reward DESC, slug ASC;
  `);

  const seasonMissions = await db.execute(sql`
    SELECT m.id, m.slug, m.name, m.description, m.city, m.state, m.category, m.target_count, m.points_reward
    FROM mycarmind_missions m
    ORDER BY m.points_reward DESC, m.name ASC;
  `);

  if (!userId) {
    return NextResponse.json({
      today: {
        date_key: dateKey,
        missions: todayMissions,
        progress: [],
      },
      season: {
        missions: seasonMissions,
        progress: [],
      },
      missions: seasonMissions,
    });
  }

  const { todayProgress, seasonProgress } = await withUserDbContext(
    userId,
    async (tx) => {
      const [dailyRows, seasonRows] = await Promise.all([
        tx.execute(sql`
        SELECT date_key, slug, progress_count, completed, updated_at
        FROM mycarmind_daily_mission_progress
        WHERE user_id = ${userId} AND date_key = ${dateKey};
      `),
        tx.execute(sql`
        SELECT mission_id, progress_count, completed_at, updated_at
        FROM mycarmind_mission_progress
        WHERE user_id = ${userId};
      `),
      ]);

      return { todayProgress: dailyRows, seasonProgress: seasonRows };
    }
  );

  const seasonProgressByMissionId = new Map(
    seasonProgress.map((row) => [row.mission_id, row])
  );

  const legacyMissions = seasonMissions.map((mission) => {
    const progress = seasonProgressByMissionId.get(mission.id);

    return {
      ...mission,
      progress_count: progress?.progress_count ?? 0,
      completed_at: progress?.completed_at ?? null,
    };
  });

  return NextResponse.json({
    today: {
      date_key: dateKey,
      missions: todayMissions,
      progress: todayProgress,
    },
    season: {
      missions: seasonMissions,
      progress: seasonProgress,
    },
    missions: legacyMissions,
  });
}
