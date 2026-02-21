import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { resolveCommonsDmDrawpadAccess } from "@/lib/commons/dm-drawpad-access";
import { loadDmDrawpadDraft, upsertDmDrawpadDraft } from "@/lib/db/dm-queries";

const putSchema = z.object({
  draft: z.record(z.string(), z.unknown()),
});

async function getAccess(dmId: string, userId: string) {
  return resolveCommonsDmDrawpadAccess({ dmId, userId });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ dmId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { dmId } = await context.params;
  const access = await getAccess(dmId, session.user.id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const draft = await loadDmDrawpadDraft({
    roomId: access.campfireId,
    userId: session.user.id,
  });

  return NextResponse.json({ draft });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ dmId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { dmId } = await context.params;
  const access = await getAccess(dmId, session.user.id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const draft = await upsertDmDrawpadDraft({
    roomId: access.campfireId,
    userId: session.user.id,
    draft: parsed.data.draft,
  });

  return NextResponse.json({ draft });
}
