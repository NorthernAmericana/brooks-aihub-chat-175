import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDmDrawpadDraft, upsertDmDrawpadDraft } from "@/lib/db/dm-queries";
import { requireAuthUserId, requireRoomMembership } from "@/lib/dm/http";

const putSchema = z.object({
  draft: z.record(z.string(), z.unknown()),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;

  const authResult = await requireAuthUserId();
  if (authResult.response) {
    return authResult.response;
  }

  const memberResult = await requireRoomMembership(roomId, authResult.userId);
  if (memberResult.response) {
    return memberResult.response;
  }

  const draft = await loadDmDrawpadDraft({
    roomId,
    userId: authResult.userId,
  });

  return NextResponse.json({ draft });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await context.params;

  const authResult = await requireAuthUserId();
  if (authResult.response) {
    return authResult.response;
  }

  const memberResult = await requireRoomMembership(roomId, authResult.userId);
  if (memberResult.response) {
    return memberResult.response;
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
    roomId,
    userId: authResult.userId,
    draft: parsed.data.draft,
  });

  return NextResponse.json({ draft });
}
