import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDmRoomInvite,
  getDmRoomCapacitySnapshot,
} from "@/lib/db/dm-queries";
import { requireAuthUserId, requireRoomMembership } from "@/lib/dm/http";
import { issueDmInviteToken } from "@/lib/dm/invite-token";

const schema = z.object({
  roomId: z.string().uuid(),
  targetEmail: z.string().email(),
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
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const memberResult = await requireRoomMembership(
    parsed.data.roomId,
    authResult.userId
  );
  if (memberResult.response) {
    return memberResult.response;
  }

  const capacity = await getDmRoomCapacitySnapshot(parsed.data.roomId);
  if (!capacity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (capacity.memberCount >= capacity.memberLimit) {
    return NextResponse.json({ error: "Room is at capacity" }, { status: 409 });
  }

  const invite = issueDmInviteToken({
    expiresInSeconds: parsed.data.expiresInSeconds,
  });
  const targetEmail = parsed.data.targetEmail.trim().toLowerCase();

  await createDmRoomInvite({
    roomId: parsed.data.roomId,
    inviterUserId: authResult.userId,
    targetEmail,
    tokenHash: invite.tokenHash,
    expiresAt: invite.expiresAt,
  });

  const inviteUrl = `/dm/invite/${invite.token}`;

  return NextResponse.json({
    invite: {
      token: invite.token,
      inviteUrl,
      roomId: parsed.data.roomId,
      inviterUserId: authResult.userId,
      targetEmail,
      expiresInSeconds: invite.expiresInSeconds,
      expiresAt: invite.expiresAt,
    },
  });
}
