import { NextResponse } from "next/server";
import { z } from "zod";
import { createDmImageMessage } from "@/lib/db/dm-queries";
import {
  DM_MESSAGE_BODY_MAX_LENGTH,
  loadAuthorsById,
  normalizeDmMessage,
  requireAuthUserId,
  requireRoomMembership,
} from "@/lib/dm/http";

const schema = z.object({
  assetUrl: z.string().url(),
  body: z.string().trim().max(DM_MESSAGE_BODY_MAX_LENGTH).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
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

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { message, attachment } = await createDmImageMessage({
    roomId,
    senderUserId: authResult.userId,
    body: parsed.data.body,
    assetUrl: parsed.data.assetUrl,
    metadata: parsed.data.metadata,
  });

  const authorsById = await loadAuthorsById([authResult.userId]);

  return NextResponse.json({
    message: normalizeDmMessage(
      {
        ...message,
        attachments: [attachment],
      },
      authorsById
    ),
  });
}
