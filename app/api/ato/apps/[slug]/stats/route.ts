import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps, userInstalls } from "@/lib/db/schema";
import { isAtoAppReviewsTableReady } from "@/lib/ato/reviews-table";

export const dynamic = "force-dynamic";

const getAppBySlug = async (slug: string) => {
  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, slug))
    .limit(1);

  return app ?? null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const app = await getAppBySlug(trimmedSlug);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  const [installStats] = await db
    .select({ downloads: sql<number>`count(*)` })
    .from(userInstalls)
    .where(eq(userInstalls.appId, app.id));

  const hasReviewsTable = await isAtoAppReviewsTableReady();
  const [ratingStats] = hasReviewsTable
    ? await db
        .select({
          averageRating: sql<number | null>`avg(${atoAppReviews.rating})`,
          reviewsCount: sql<number>`count(*)`,
        })
        .from(atoAppReviews)
        .where(eq(atoAppReviews.appId, app.id))
    : [null];

  return NextResponse.json({
    downloads_count: Number(installStats?.downloads ?? 0),
    avg_rating:
      ratingStats?.averageRating == null
        ? null
        : Number(ratingStats.averageRating),
    reviews_count: Number(ratingStats?.reviewsCount ?? 0),
  });
}
