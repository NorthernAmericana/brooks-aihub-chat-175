import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myflowerDailyGoals } from "@/lib/db/schema";
import { buildGoalResponse, parseOptionalNumber } from "../utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.warn("Failed to parse myflower goal payload", error);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const targetG =
      typeof body === "object" && body !== null && "target_g" in body
        ? parseOptionalNumber((body as { target_g?: unknown }).target_g)
        : null;
    if (Number.isNaN(targetG)) {
      return NextResponse.json(
        { error: "target_g must be a number" },
        { status: 400 }
      );
    }

    const targetMgThc =
      typeof body === "object" && body !== null && "target_mg_thc" in body
        ? parseOptionalNumber((body as { target_mg_thc?: unknown }).target_mg_thc)
        : null;
    if (Number.isNaN(targetMgThc)) {
      return NextResponse.json(
        { error: "target_mg_thc must be a number" },
        { status: 400 }
      );
    }

    if (targetG === null && targetMgThc === null) {
      return NextResponse.json(
        { error: "Provide at least one target value" },
        { status: 400 }
      );
    }

    if (targetG !== null && targetG < 0) {
      return NextResponse.json(
        { error: "target_g must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (targetMgThc !== null && targetMgThc < 0) {
      return NextResponse.json(
        { error: "target_mg_thc must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    const now = new Date();

    const [goal] = await db
      .insert(myflowerDailyGoals)
      .values({
        userId: session.user.id,
        targetG: targetG === null ? "0" : String(targetG),
        targetMgThc: targetMgThc === null ? null : String(targetMgThc),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [myflowerDailyGoals.userId],
        set: {
          targetG: targetG === null ? "0" : String(targetG),
          targetMgThc: targetMgThc === null ? null : String(targetMgThc),
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json({ goal: buildGoalResponse(goal ?? null) });
  } catch (error) {
    console.error("Failed to upsert myflower daily goal", error);
    return NextResponse.json(
      { error: "Failed to update daily goal" },
      { status: 500 }
    );
  }
}
