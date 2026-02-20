import { and, asc, count, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dmDrawpadDrafts,
  dmMessageAttachments,
  dmMessages,
  dmRoomInvites,
  dmRoomMembers,
  dmRooms,
  user,
} from "@/lib/db/schema";

export async function loadDmRoomByIdForMember(options: {
  roomId: string;
  userId: string;
}) {
  const [room] = await db
    .select({
      id: dmRooms.id,
      createdAt: dmRooms.createdAt,
      updatedAt: dmRooms.updatedAt,
      createdByUserId: dmRooms.createdByUserId,
      membershipId: dmRoomMembers.id,
      membershipCreatedAt: dmRoomMembers.createdAt,
    })
    .from(dmRooms)
    .innerJoin(
      dmRoomMembers,
      and(
        eq(dmRoomMembers.roomId, dmRooms.id),
        eq(dmRoomMembers.userId, options.userId)
      )
    )
    .where(eq(dmRooms.id, options.roomId))
    .limit(1);

  return room ?? null;
}

export async function getDmRoomMemberCount(roomId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(dmRoomMembers)
    .where(eq(dmRoomMembers.roomId, roomId));

  return result?.value ?? 0;
}

export async function getDmRoomCapacitySnapshot(roomId: string) {
  const [room] = await db
    .select({
      roomId: dmRooms.id,
      createdByUserId: dmRooms.createdByUserId,
      founderAccess: user.foundersAccess,
    })
    .from(dmRooms)
    .innerJoin(user, eq(user.id, dmRooms.createdByUserId))
    .where(eq(dmRooms.id, roomId))
    .limit(1);

  if (!room) {
    return null;
  }

  const memberCount = await getDmRoomMemberCount(roomId);
  const memberLimit = room.founderAccess ? 12 : 4;

  return {
    roomId: room.roomId,
    createdByUserId: room.createdByUserId,
    memberCount,
    memberLimit,
  };
}

export async function createDmRoomInvite(options: {
  roomId: string;
  inviterUserId: string;
  targetEmail: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const [invite] = await db
    .insert(dmRoomInvites)
    .values({
      roomId: options.roomId,
      inviterUserId: options.inviterUserId,
      targetEmail: options.targetEmail,
      tokenHash: options.tokenHash,
      expiresAt: options.expiresAt,
    })
    .returning();

  return invite;
}

export async function getDmRoomInviteByTokenHash(tokenHash: string) {
  const [invite] = await db
    .select()
    .from(dmRoomInvites)
    .where(eq(dmRoomInvites.tokenHash, tokenHash))
    .limit(1);

  return invite ?? null;
}

export async function addDmRoomMemberIfMissing(options: {
  roomId: string;
  userId: string;
}) {
  const [member] = await db
    .insert(dmRoomMembers)
    .values({ roomId: options.roomId, userId: options.userId })
    .onConflictDoNothing({
      target: [dmRoomMembers.roomId, dmRoomMembers.userId],
    })
    .returning();

  return member ?? null;
}

export async function acceptDmRoomInvite(options: {
  inviteId: string;
  acceptedByUserId: string;
}) {
  const [invite] = await db
    .update(dmRoomInvites)
    .set({ acceptedAt: new Date(), acceptedByUserId: options.acceptedByUserId })
    .where(eq(dmRoomInvites.id, options.inviteId))
    .returning();

  return invite ?? null;
}

export async function getDmRoomMessageCount(roomId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(dmMessages)
    .where(eq(dmMessages.roomId, roomId));

  return result?.value ?? 0;
}

export function listDmRoomMembers(roomId: string) {
  return db
    .select({
      membershipId: dmRoomMembers.id,
      roomId: dmRoomMembers.roomId,
      userId: dmRoomMembers.userId,
      joinedAt: dmRoomMembers.createdAt,
      avatarUrl: user.avatarUrl,
    })
    .from(dmRoomMembers)
    .innerJoin(user, eq(user.id, dmRoomMembers.userId))
    .where(eq(dmRoomMembers.roomId, roomId))
    .orderBy(asc(dmRoomMembers.createdAt));
}

export async function listDmMessagesWithAttachments(options: {
  roomId: string;
  limit?: number;
  beforeCreatedAt?: Date;
}) {
  const messageRows = await db
    .select({
      id: dmMessages.id,
      roomId: dmMessages.roomId,
      senderUserId: dmMessages.senderUserId,
      body: dmMessages.body,
      createdAt: dmMessages.createdAt,
      updatedAt: dmMessages.updatedAt,
    })
    .from(dmMessages)
    .where(
      options.beforeCreatedAt
        ? and(
            eq(dmMessages.roomId, options.roomId),
            lt(dmMessages.createdAt, options.beforeCreatedAt)
          )
        : eq(dmMessages.roomId, options.roomId)
    )
    .orderBy(desc(dmMessages.createdAt))
    .limit(options.limit ?? 50);

  if (messageRows.length === 0) {
    return [];
  }

  const messageIds = messageRows.map((row) => row.id);
  const attachmentRows = await db
    .select({
      id: dmMessageAttachments.id,
      messageId: dmMessageAttachments.messageId,
      roomId: dmMessageAttachments.roomId,
      uploaderUserId: dmMessageAttachments.uploaderUserId,
      kind: dmMessageAttachments.kind,
      assetUrl: dmMessageAttachments.assetUrl,
      metadata: dmMessageAttachments.metadata,
      createdAt: dmMessageAttachments.createdAt,
    })
    .from(dmMessageAttachments)
    .where(inArray(dmMessageAttachments.messageId, messageIds))
    .orderBy(asc(dmMessageAttachments.createdAt));

  const attachmentsByMessageId = new Map<string, typeof attachmentRows>();
  for (const row of attachmentRows) {
    const currentRows = attachmentsByMessageId.get(row.messageId) ?? [];
    currentRows.push(row);
    attachmentsByMessageId.set(row.messageId, currentRows);
  }

  return messageRows.map((message) => ({
    ...message,
    attachments: attachmentsByMessageId.get(message.id) ?? [],
  }));
}

export async function createDmTextMessage(options: {
  roomId: string;
  senderUserId: string;
  body: string;
}) {
  const [message] = await db
    .insert(dmMessages)
    .values({
      roomId: options.roomId,
      senderUserId: options.senderUserId,
      body: options.body,
    })
    .returning();

  return message;
}

export function createDmImageMessage(options: {
  roomId: string;
  senderUserId: string;
  assetUrl: string;
  metadata?: Record<string, unknown> | null;
  body?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [message] = await tx
      .insert(dmMessages)
      .values({
        roomId: options.roomId,
        senderUserId: options.senderUserId,
        body: options.body ?? null,
      })
      .returning();

    const [attachment] = await tx
      .insert(dmMessageAttachments)
      .values({
        messageId: message.id,
        roomId: options.roomId,
        uploaderUserId: options.senderUserId,
        kind: "image",
        assetUrl: options.assetUrl,
        metadata: options.metadata ?? null,
      })
      .returning();

    return { message, attachment };
  });
}

export async function loadDmDrawpadDraft(options: {
  roomId: string;
  userId: string;
}) {
  const [draft] = await db
    .select()
    .from(dmDrawpadDrafts)
    .where(
      and(
        eq(dmDrawpadDrafts.roomId, options.roomId),
        eq(dmDrawpadDrafts.userId, options.userId)
      )
    )
    .limit(1);

  return draft ?? null;
}

export async function upsertDmDrawpadDraft(options: {
  roomId: string;
  userId: string;
  draft: Record<string, unknown>;
}) {
  const [draft] = await db
    .insert(dmDrawpadDrafts)
    .values({
      roomId: options.roomId,
      userId: options.userId,
      draft: options.draft,
    })
    .onConflictDoUpdate({
      target: [dmDrawpadDrafts.roomId, dmDrawpadDrafts.userId],
      set: {
        draft: options.draft,
        updatedAt: new Date(),
      },
    })
    .returning();

  return draft;
}
