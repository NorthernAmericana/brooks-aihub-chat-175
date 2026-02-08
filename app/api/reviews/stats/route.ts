import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoApps, review, userInstalls } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appSlug = searchParams.get("appSlug")?.trim();

  if (!appSlug) {
    return NextResponse.json(
      { error: "appSlug query param is required." },
      { status: 400 }
    );
  }

  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, appSlug))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  const [installStats] = await db
    .select({ downloads: sql<number>`count(*)` })
    .from(userInstalls)
    .where(eq(userInstalls.appId, app.id));

  const [ratingStats] = await db
    .select({
      rating: sql<number | null>`avg(${review.rating})`,
      ratingCount: sql<number>`count(*)`,
    })
    .from(review)
    .where(eq(review.placeId, appSlug));

  return NextResponse.json({
    stats: {
      downloads: Number(installStats?.downloads ?? 0),
      rating:
        ratingStats?.rating == null ? null : Number(ratingStats.rating ?? 0),
      ratingCount: Number(ratingStats?.ratingCount ?? 0),
    },
  });
}
