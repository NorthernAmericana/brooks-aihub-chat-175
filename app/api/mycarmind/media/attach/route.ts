import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";

const schema = z.object({ placeId: z.string().uuid().optional(), visitId: z.string().uuid().optional(), mediaAssetId: z.string().uuid().optional(), publishToCommons: z.boolean().default(false), commonsPostTitle: z.string().optional(), commonsPostBody: z.string().optional() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let commonsPostId: string | null = null;
  if (parsed.data.publishToCommons && parsed.data.commonsPostTitle && parsed.data.commonsPostBody) {
    const campfireRows = await db.execute<{ id: string }>(sql`SELECT id FROM campfires WHERE path = 'mycarmind/travel' LIMIT 1;`);
    const campfireId = campfireRows[0]?.id;
    if (campfireId) {
      const postRows = await db.execute<{ id: string }>(sql`
        INSERT INTO commons_posts (campfire_id, author_id, title, body)
        VALUES (${campfireId}, ${session.user.id}, ${parsed.data.commonsPostTitle}, ${parsed.data.commonsPostBody})
        RETURNING id;
      `);
      commonsPostId = postRows[0]?.id ?? null;
    }
  }

  await db.execute(sql`
    INSERT INTO mycarmind_media_assets (user_id, place_id, visit_id, media_asset_id, publish_to_commons, commons_post_id)
    VALUES (${session.user.id}, ${parsed.data.placeId ?? null}, ${parsed.data.visitId ?? null}, ${parsed.data.mediaAssetId ?? null}, ${parsed.data.publishToCommons}, ${commonsPostId});
  `);

  return NextResponse.json({ attached: true, commonsPostId });
}
