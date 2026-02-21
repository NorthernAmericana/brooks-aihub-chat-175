import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  commonsCampfire,
  commonsCampfireMembers,
  memory,
  notification,
  user,
} from "@/lib/db/schema";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

function mapNotification(row: typeof notification.$inferSelect): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(notification)
    .where(and(eq(notification.userId, userId), eq(notification.isRead, false)));

  return Number(row?.value ?? 0);
}

export async function listNotificationsForUser(options: {
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(options.limit ?? 6, 1), 25);

  const rows = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, options.userId),
        options.cursor
          ? lt(notification.createdAt, new Date(options.cursor))
          : undefined
      )
    )
    .orderBy(desc(notification.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  return {
    notifications: pageRows.map(mapNotification),
    nextCursor: hasMore
      ? pageRows[pageRows.length - 1]?.createdAt.toISOString() ?? null
      : null,
    hasMore,
  };
}

export async function markNotificationRead(options: {
  notificationId: string;
  userId: string;
}) {
  const [updated] = await db
    .update(notification)
    .set({
      isRead: true,
      readAt: sql`now()`,
    })
    .where(
      and(
        eq(notification.id, options.notificationId),
        eq(notification.userId, options.userId)
      )
    )
    .returning();

  return updated ? mapNotification(updated) : null;
}

export async function createHostRequestNotification(options: {
  dmId: string;
  requesterUserId: string;
}) {
  const campfirePath = `dm/${options.dmId}`;

  const [requester] = await db
    .select({ email: user.email, nickname: user.publicNickname })
    .from(user)
    .where(eq(user.id, options.requesterUserId))
    .limit(1);

  if (!requester) {
    return { ok: false as const, error: "Requester not found." as const };
  }

  const [campfire] = await db
    .select({ id: commonsCampfire.id, name: commonsCampfire.name })
    .from(commonsCampfire)
    .innerJoin(
      commonsCampfireMembers,
      and(
        eq(commonsCampfireMembers.campfireId, commonsCampfire.id),
        eq(commonsCampfireMembers.userId, options.requesterUserId)
      )
    )
    .where(eq(commonsCampfire.path, campfirePath))
    .limit(1);

  if (!campfire) {
    return { ok: false as const, error: "DM campfire not found." as const };
  }

  const [hostMember] = await db
    .select({ hostUserId: commonsCampfireMembers.userId })
    .from(commonsCampfireMembers)
    .where(
      and(
        eq(commonsCampfireMembers.campfireId, campfire.id),
        eq(commonsCampfireMembers.role, "host")
      )
    )
    .limit(1);

  if (!hostMember || hostMember.hostUserId === options.requesterUserId) {
    return { ok: false as const, error: "Host not available for request." as const };
  }

  const requesterLabel = requester.nickname?.trim() || requester.email;

  const [created] = await db
    .insert(notification)
    .values({
      userId: hostMember.hostUserId,
      type: "dm_host_request",
      title: "New DM campfire request",
      body: `${requesterLabel} requests for you to create a private campfire DM chatroom with them inside, /NAT: Commons/.`,
      data: {
        campfireId: campfire.id,
        campfireName: campfire.name,
        requesterUserId: options.requesterUserId,
      },
    })
    .returning();

  return { ok: true as const, notification: mapNotification(created) };
}

export async function createMemoryReminderNotifications(userId: string): Promise<number> {
  const recentMemories = await db
    .select({ id: memory.id, rawText: memory.rawText, createdAt: memory.createdAt })
    .from(memory)
    .where(
      and(
        eq(memory.ownerId, userId),
        eq(memory.isApproved, true),
        eq(memory.sourceType, "chat")
      )
    )
    .orderBy(desc(memory.createdAt))
    .limit(25);

  let createdCount = 0;

  for (const item of recentMemories) {
    const text = item.rawText.toLowerCase();
    if (!text.includes("court") && !text.includes("birthday")) {
      continue;
    }

    const alreadyExists = await db
      .select({ id: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.type, "memory_event_preview"),
          sql`${notification.data} ->> 'memoryId' = ${item.id}`
        )
      )
      .limit(1);

    if (alreadyExists.length > 0) {
      continue;
    }

    const summary = text.includes("court")
      ? "You mentioned a court date in memory. AI reminder preview is active (early prototype)."
      : "You mentioned a birthday in memory. AI reminder preview is active (early prototype).";

    await db.insert(notification).values({
      userId,
      type: "memory_event_preview",
      title: "AI reminder preview",
      body: summary,
      data: { memoryId: item.id },
    });
    createdCount += 1;
  }

  return createdCount;
}
