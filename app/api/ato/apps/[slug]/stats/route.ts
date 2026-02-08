import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps, userInstalls } from "@/lib/db/schema";

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
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const app = await getAppBySlug(slug);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  const [installStats] = await db
    .select({ downloads: sql<number>`count(*)` })
    .from(userInstalls)
    .where(eq(userInstalls.appId, app.id));

  const [ratingStats] = await db
    .select({
      averageRating: sql<number | null>`avg(${atoAppReviews.rating})`,
      reviewsCount: sql<number>`count(*)`,
    })
    .from(atoAppReviews)
    .where(eq(atoAppReviews.appId, app.id));

  return NextResponse.json({
    downloads_count: Number(installStats?.downloads ?? 0),
    avg_rating:
      ratingStats?.averageRating == null
        ? null
        : Number(ratingStats.averageRating),
    reviews_count: Number(ratingStats?.reviewsCount ?? 0),
  });
}
