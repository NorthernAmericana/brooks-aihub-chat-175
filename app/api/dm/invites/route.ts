import { NextResponse } from "next/server";
import { z } from "zod";
import { issueDmInviteToken } from "@/lib/dm/invite-token";
import { requireAuthUserId, requireRoomMembership } from "@/lib/dm/http";

const schema = z.object({
  roomId: z.string().uuid(),
  expiresInSeconds: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const authResult = await requireAuthUserId();
  if (authResult.response) {
    return authResult.response;
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

  const memberResult = await requireRoomMembership(parsed.data.roomId, authResult.userId);
  if (memberResult.response) {
    return memberResult.response;
  }

  const invite = issueDmInviteToken({
    roomId: parsed.data.roomId,
    inviterUserId: authResult.userId,
    expiresInSeconds: parsed.data.expiresInSeconds,
  });

  return NextResponse.json({
    invite: {
      token: invite.token,
      roomId: parsed.data.roomId,
      inviterUserId: authResult.userId,
      expiresInSeconds: invite.expiresInSeconds,
      expiresAt: invite.expiresAt,
    },
  });
}
