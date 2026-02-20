import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { dmRoomMembers, user } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const DM_MESSAGE_PAGE_LIMIT_DEFAULT = 50;
export const DM_MESSAGE_PAGE_LIMIT_MAX = 100;
export const DM_MESSAGE_BODY_MAX_LENGTH = 4_000;

export async function requireAuthUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId, response: null };
}

export async function requireRoomMembership(roomId: string, userId: string) {
  const [membership] = await db
    .select({ id: dmRoomMembers.id })
    .from(dmRoomMembers)
    .where(and(eq(dmRoomMembers.roomId, roomId), eq(dmRoomMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    return {
      membership: null,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { membership, response: null };
}

export type DmAuthor = {
  id: string;
  email: string;
  avatarUrl: string | null;
};

export async function loadAuthorsById(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, DmAuthor>();
  }

  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })
    .from(user)
    .where(inArray(user.id, [...new Set(userIds)]));

  return new Map(rows.map((row) => [row.id, row]));
}

export function normalizeDmMessage(
  row: {
    id: string;
    roomId: string;
    senderUserId: string;
    body: string | null;
    createdAt: Date;
    updatedAt: Date;
    attachments: Array<{
      id: string;
      messageId: string;
      roomId: string;
      uploaderUserId: string;
      kind: "image";
      assetUrl: string;
      metadata: unknown;
      createdAt: Date;
    }>;
  },
  authorsById: Map<string, DmAuthor>
) {
  return {
    id: row.id,
    roomId: row.roomId,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: authorsById.get(row.senderUserId) ?? {
      id: row.senderUserId,
      email: "unknown",
      avatarUrl: null,
    },
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      kind: attachment.kind,
      assetUrl: attachment.assetUrl,
      metadata: attachment.metadata,
      createdAt: attachment.createdAt,
      uploaderUserId: attachment.uploaderUserId,
    })),
  };
}
