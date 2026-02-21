import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { resolveCommonsDmDrawpadAccess } from "@/lib/commons/dm-drawpad-access";
import { db } from "@/lib/db";
import { commonsPost } from "@/lib/db/schema";

const schema = z.object({
  assetUrl: z.string().url(),
  body: z.string().trim().max(4_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ dmId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { dmId } = await context.params;
  const access = await resolveCommonsDmDrawpadAccess({
    dmId,
    userId: session.user.id,
  });

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const bodyPrefix = `![Draw pad image](${parsed.data.assetUrl})`;
  const normalizedBody = parsed.data.body?.trim();
  const messageBody = normalizedBody ? `${bodyPrefix}\n\n${normalizedBody}` : bodyPrefix;

  const [message] = await db
    .insert(commonsPost)
    .values({
      campfireId: access.campfireId,
      authorId: session.user.id,
      title: "Draw Pad",
      body: messageBody,
      bodyFormat: "markdown",
    })
    .returning();

  return NextResponse.json({ message, metadata: parsed.data.metadata ?? null }, { status: 201 });
}
