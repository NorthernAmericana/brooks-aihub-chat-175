import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myflowerDailyGoals, myflowerLogs } from "@/lib/db/schema";
import { buildGoalResponse, buildLogResponse, parseDayRange } from "../utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const parsedRange = parseDayRange(dateParam);

    if (!parsedRange) {
      return NextResponse.json(
        { error: "date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const [goal] = await db
      .select()
      .from(myflowerDailyGoals)
      .where(eq(myflowerDailyGoals.userId, session.user.id));

    const logs = await db
      .select()
      .from(myflowerLogs)
      .where(
        and(
          eq(myflowerLogs.userId, session.user.id),
          gte(myflowerLogs.occurredAt, parsedRange.start),
          lte(myflowerLogs.occurredAt, parsedRange.end)
        )
      )
      .orderBy(myflowerLogs.occurredAt);

    const totals = {
      count: logs.length,
      total_g: 0,
      total_mg_thc: 0,
    };

    const strainsUsedMap = new Map<
      string,
      {
        strain_slug: string | null;
        strain_name: string | null;
        display_name: string;
        count: number;
        total_g: number;
        total_mg_thc: number;
      }
    >();

    logs.forEach((log) => {
      const amountG = log.amountG === null ? 0 : Number(log.amountG);
      const amountMgThc =
        log.amountMgThc === null ? 0 : Number(log.amountMgThc);

      if (Number.isFinite(amountG)) {
        totals.total_g += amountG;
      }

      if (Number.isFinite(amountMgThc)) {
        totals.total_mg_thc += amountMgThc;
      }

      const key = log.strainSlug ?? log.strainName ?? "unknown";
      const displayName = log.strainName ?? log.strainSlug ?? "Unknown strain";
      const current = strainsUsedMap.get(key) ?? {
        strain_slug: log.strainSlug ?? null,
        strain_name: log.strainName ?? null,
        display_name: displayName,
        count: 0,
        total_g: 0,
        total_mg_thc: 0,
      };

      current.count += 1;

      if (Number.isFinite(amountG)) {
        current.total_g += amountG;
      }

      if (Number.isFinite(amountMgThc)) {
        current.total_mg_thc += amountMgThc;
      }

      strainsUsedMap.set(key, current);
    });

    return NextResponse.json({
      date: parsedRange.date,
      totals,
      goal: buildGoalResponse(goal ?? null),
      strains_used: Array.from(strainsUsedMap.values()).sort((a, b) =>
        a.display_name.localeCompare(b.display_name)
      ),
      logs: logs.map(buildLogResponse),
    });
  } catch (error) {
    console.error("Failed to fetch myflower day logs", error);
    return NextResponse.json(
      { error: "Failed to load daily usage" },
      { status: 500 }
    );
  }
}
