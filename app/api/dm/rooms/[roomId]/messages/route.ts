import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDmTextMessage,
  getDmRoomMessageCount,
  listDmMessagesWithAttachments,
} from "@/lib/db/dm-queries";
import {
  DM_MESSAGE_BODY_MAX_LENGTH,
  DM_MESSAGE_PAGE_LIMIT_DEFAULT,
  DM_MESSAGE_PAGE_LIMIT_MAX,
  loadAuthorsById,
  normalizeDmMessage,
  requireAuthUserId,
  requireRoomMembership,
} from "@/lib/dm/http";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(DM_MESSAGE_PAGE_LIMIT_MAX).optional(),
  beforeCreatedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
});

const postSchema = z.object({
  body: z.string().trim().min(1).max(DM_MESSAGE_BODY_MAX_LENGTH),
});

export async function GET(
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

  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    beforeCreatedAt: searchParams.get("beforeCreatedAt") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsedQuery.error.issues }, { status: 400 });
  }

  const limit = parsedQuery.data.limit ?? DM_MESSAGE_PAGE_LIMIT_DEFAULT;
  const rows = await listDmMessagesWithAttachments({
    roomId,
    limit,
    beforeCreatedAt: parsedQuery.data.beforeCreatedAt,
  });

  const authorsById = await loadAuthorsById(rows.map((row) => row.senderUserId));
  const messages = rows.map((row) => normalizeDmMessage(row, authorsById));
  const total = await getDmRoomMessageCount(roomId);

  return NextResponse.json({
    messages,
    counts: {
      total,
    },
    page: {
      limit,
      hasMore: rows.length === limit,
      nextBeforeCreatedAt: rows.at(-1)?.createdAt ?? null,
    },
  });
}

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

  const parsed = postSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const message = await createDmTextMessage({
    roomId,
    senderUserId: authResult.userId,
    body: parsed.data.body,
  });

  const authorsById = await loadAuthorsById([authResult.userId]);

  return NextResponse.json({
    message: normalizeDmMessage(
      {
        ...message,
        attachments: [],
      },
      authorsById
    ),
  });
}
