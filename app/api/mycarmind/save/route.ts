import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { withUserDbContext } from "@/lib/db/request-context";

const schema = z.object({
  placeId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

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
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await withUserDbContext(session.user.id, async (tx) => {
    await tx.execute(sql`
      INSERT INTO mycarmind_place_saves (user_id, place_id, note)
      VALUES (${session.user.id}, ${parsed.data.placeId}, ${parsed.data.note ?? null})
      ON CONFLICT (user_id, place_id)
      DO UPDATE SET note = EXCLUDED.note;
    `);
  });

  return NextResponse.json({ saved: true });
}
