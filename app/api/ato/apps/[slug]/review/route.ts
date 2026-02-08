import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoAppReviews, atoApps } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const getAppBySlug = async (slug: string) => {
  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, slug))
    .limit(1);

  return app ?? null;
};

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const slug = params.slug?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const app = await getAppBySlug(slug);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  let payload: { rating?: number; body?: string | null };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const rating = Number(payload.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be an integer between 1 and 5." },
      { status: 400 }
    );
  }

  const body =
    typeof payload.body === "string" && payload.body.trim().length > 0
      ? payload.body.trim()
      : null;

  const now = new Date();

  const [review] = await db
    .insert(atoAppReviews)
    .values({
      appId: app.id,
      userId: session.user.id,
      rating,
      body,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [atoAppReviews.appId, atoAppReviews.userId],
      set: {
        rating,
        body,
        updatedAt: now,
      },
    })
    .returning();

  return NextResponse.json({ review });
}
