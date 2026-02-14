import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { withUserDbContext } from "@/lib/db/request-context";

const schema = z
  .object({
    placeId: z.string().uuid().optional(),
    visitId: z.string().uuid().optional(),
    mediaAssetId: z.string().uuid(),
    publishToCommons: z.boolean().default(false),
    commonsPostTitle: z.string().max(300).optional(),
    commonsPostBody: z.string().max(5000).optional(),
  })
  .refine((value) => Boolean(value.placeId || value.visitId), {
    message: "Either placeId or visitId is required.",
    path: ["placeId"],
  })
  .refine(
    (value) =>
      !value.publishToCommons ||
      (Boolean(value.commonsPostTitle) && Boolean(value.commonsPostBody)),
    {
      message:
        "commonsPostTitle and commonsPostBody are required when publishToCommons is true.",
      path: ["publishToCommons"],
    }
  );

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
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await withUserDbContext(session.user.id, async (tx) => {
    let commonsPostId: string | null = null;

    if (
      parsed.data.publishToCommons &&
      parsed.data.commonsPostTitle &&
      parsed.data.commonsPostBody
    ) {
      const campfireRows = await tx.execute<{ id: string }>(
        sql`SELECT id FROM campfires WHERE path = 'mycarmind/travel' LIMIT 1;`
      );
      const campfireId = campfireRows[0]?.id;

      if (campfireId) {
        const postRows = await tx.execute<{ id: string }>(sql`
          INSERT INTO commons_posts (campfire_id, author_id, title, body)
          VALUES (${campfireId}, ${session.user.id}, ${parsed.data.commonsPostTitle}, ${parsed.data.commonsPostBody})
          RETURNING id;
        `);
        commonsPostId = postRows[0]?.id ?? null;
      }
    }

    await tx.execute(sql`
      INSERT INTO mycarmind_media_assets (user_id, place_id, visit_id, media_asset_id, publish_to_commons, commons_post_id)
      VALUES (${session.user.id}, ${parsed.data.placeId ?? null}, ${parsed.data.visitId ?? null}, ${parsed.data.mediaAssetId}, ${parsed.data.publishToCommons}, ${commonsPostId});
    `);

    return { attached: true, commonsPostId };
  });

  return NextResponse.json(result);
}
