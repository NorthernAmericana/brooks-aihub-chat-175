import { NextResponse } from "next/server";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps, user } from "@/lib/db/schema";
import { getSafeDisplayName } from "@/lib/ato/reviews";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

const getAppBySlug = async (slug: string) => {
  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, slug))
    .limit(1);

  return app ?? null;
};

const parseCursor = (cursor: string | null) => {
  if (!cursor) {
    return null;
  }

  const [timestamp, id] = cursor.split("|");
  const date = new Date(timestamp);

  if (!timestamp || Number.isNaN(date.valueOf())) {
    return null;
  }

  return { date, id };
};

export async function GET(
  request: Request,
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

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const cursorParam = searchParams.get("cursor");

  const limit = Math.min(
    Math.max(Number(limitParam) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const cursor = parseCursor(cursorParam);

  const filters = [eq(atoAppReviews.appId, app.id)];

  if (cursor) {
    if (cursor.id) {
      filters.push(
        or(
          lt(atoAppReviews.createdAt, cursor.date),
          and(
            eq(atoAppReviews.createdAt, cursor.date),
            lt(atoAppReviews.id, cursor.id)
          )
        )
      );
    } else {
      filters.push(lt(atoAppReviews.createdAt, cursor.date));
    }
  }

  const rows = await db
    .select({
      id: atoAppReviews.id,
      rating: atoAppReviews.rating,
      body: atoAppReviews.body,
      createdAt: atoAppReviews.createdAt,
      email: user.email,
    })
    .from(atoAppReviews)
    .innerJoin(user, eq(atoAppReviews.userId, user.id))
    .where(and(...filters))
    .orderBy(desc(atoAppReviews.createdAt), desc(atoAppReviews.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const trimmedRows = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor = hasNextPage
    ? `${trimmedRows[trimmedRows.length - 1]?.createdAt.toISOString()}|${
        trimmedRows[trimmedRows.length - 1]?.id
      }`
    : null;

  return NextResponse.json({
    reviews: trimmedRows.map((row) => ({
      id: row.id,
      rating: row.rating,
      body: row.body,
      created_at: row.createdAt.toISOString(),
      display_name: getSafeDisplayName(row.email),
    })),
    next_cursor: nextCursor,
  });
}
