import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getApprovedMemoriesByUserIdPage,
  getDistinctApprovedMemoryRoutesByUserId,
} from "@/lib/db/queries";
import { buildMemoryItems } from "../../../memories/memory-utils";

export const dynamic = "force-dynamic";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  const route = searchParams.get("route")?.trim() || undefined;
  const projectRoute = searchParams.get("projectRoute")?.trim() || undefined;
  const freshness = searchParams.get("freshness");
  const freshnessSort = searchParams.get("freshnessSort");

  const safeLimit = Number.isFinite(limit) ? clamp(limit, 1, 50) : 50;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  const { rows, nextCursor } = await getApprovedMemoriesByUserIdPage({
    userId: session.user.id,
    limit: safeLimit,
    offset: safeOffset,
    route,
    projectRoute,
  });

  const memoryItems = await buildMemoryItems(rows);
  const freshnessFilteredItems =
    freshness === "recent" || freshness === "outdated"
      ? memoryItems.filter((memory) => memory.freshnessStatus === freshness)
      : memoryItems;

  const sortedItems = [...freshnessFilteredItems].sort((a, b) => {
    if (freshnessSort === "recent-first") {
      return a.memoryAgeHours - b.memoryAgeHours;
    }

    if (freshnessSort === "outdated-first") {
      return b.memoryAgeHours - a.memoryAgeHours;
    }

    return 0;
  });

  const distinctRoutes = await getDistinctApprovedMemoryRoutesByUserId({
    userId: session.user.id,
  });

  return NextResponse.json({
    rows: sortedItems,
    nextCursor,
    distinctRoutes: distinctRoutes
      .map((entry) => entry.route)
      .filter((entry): entry is string => Boolean(entry)),
  });
}
