import {
  and,
  desc,
  eq,
  inArray,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
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

type NotificationCursor = {
  createdAt: string;
  id: string;
};

function encodeCursor(cursor: NotificationCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(cursor: string): NotificationCursor | null {
  try {
    const value = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<NotificationCursor>;

    if (
      !value ||
      typeof value.createdAt !== "string" ||
      typeof value.id !== "string"
    ) {
      return null;
    }

    return {
      createdAt: value.createdAt,
      id: value.id,
    };
  } catch (_error) {
    return null;
  }
}

function mapNotification(
  row: typeof notification.$inferSelect,
  options?: { requesterLabel?: string }
): NotificationItem {
  const requesterLabel = options?.requesterLabel?.trim() || "A campfire member";

  if (row.type === "dm_host_request") {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: `${requesterLabel} requested that you create a private campfire DM chatroom with them inside, /NAT: Commons/.`,
      isRead: row.isRead,
      readAt: row.readAt,
      createdAt: row.createdAt,
    };
  }

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
  const parsedCursor = options.cursor ? decodeCursor(options.cursor) : null;

  let cursorClause: SQL | undefined;

  if (parsedCursor) {
    const cursorCreatedAt = new Date(parsedCursor.createdAt);

    if (!Number.isNaN(cursorCreatedAt.getTime())) {
      cursorClause = or(
        lt(notification.createdAt, cursorCreatedAt),
        and(
          eq(notification.createdAt, cursorCreatedAt),
          lt(notification.id, parsedCursor.id)
        )
      );
    }
  }

  const rows = await db
    .select()
    .from(notification)
    .where(and(eq(notification.userId, options.userId), cursorClause))
    .orderBy(desc(notification.createdAt), desc(notification.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const requesterIds = Array.from(
    new Set(
      pageRows
        .filter((row) => row.type === "dm_host_request")
        .map((row) => {
          const requesterUserId = row.data?.requesterUserId;
          return typeof requesterUserId === "string" ? requesterUserId : null;
        })
        .filter((value): value is string => Boolean(value))
    )
  );

  const requesterLabels = new Map<string, string>();

  if (requesterIds.length > 0) {
    const requesters = await db
      .select({ id: user.id, nickname: user.publicNickname })
      .from(user)
      .where(inArray(user.id, requesterIds));

    for (const requester of requesters) {
      requesterLabels.set(
        requester.id,
        requester.nickname?.trim() || "A campfire member"
      );
    }
  }

  const notifications = pageRows.map((row) => {
    const requesterUserId =
      typeof row.data?.requesterUserId === "string"
        ? row.data.requesterUserId
        : undefined;

    return mapNotification(row, {
      requesterLabel: requesterUserId
        ? requesterLabels.get(requesterUserId)
        : undefined,
    });
  });

  const nextCursor = hasMore
    ? encodeCursor({
        createdAt: pageRows[pageRows.length - 1]?.createdAt.toISOString() ?? "",
        id: pageRows[pageRows.length - 1]?.id ?? "",
      })
    : null;

  return {
    notifications,
    nextCursor,
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
    .select({ id: user.id })
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

  const [existing] = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, hostMember.hostUserId),
        eq(notification.type, "dm_host_request"),
        sql`${notification.data} ->> 'requesterUserId' = ${options.requesterUserId}`,
        sql`${notification.data} ->> 'campfireId' = ${campfire.id}`,
        eq(notification.isRead, false)
      )
    )
    .limit(1);

  if (existing) {
    return { ok: true as const, notification: mapNotification(existing) };
  }

  const [created] = await db
    .insert(notification)
    .values({
      userId: hostMember.hostUserId,
      type: "dm_host_request",
      title: "New DM campfire request",
      body: "A campfire member requested a new private DM campfire in /NAT: Commons/.",
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

  const candidates = recentMemories
    .map((item) => ({
      ...item,
      normalizedText: item.rawText.toLowerCase(),
    }))
    .filter(
      (item) =>
        item.normalizedText.includes("court") ||
        item.normalizedText.includes("birthday")
    );

  if (!candidates.length) {
    return 0;
  }

  const candidateIds = candidates.map((item) => item.id);

  const existingRows = await db
    .select({ memoryId: sql<string>`${notification.data} ->> 'memoryId'` })
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.type, "memory_event_preview"),
        inArray(sql<string>`${notification.data} ->> 'memoryId'`, candidateIds)
      )
    );

  const existingIds = new Set(
    existingRows
      .map((row) => row.memoryId)
      .filter((value): value is string => typeof value === "string")
  );

  const pendingInsert = candidates
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({
      userId,
      type: "memory_event_preview",
      title: "AI reminder preview",
      body: item.normalizedText.includes("court")
        ? "You mentioned a court date in memory. AI reminder preview is active (early prototype)."
        : "You mentioned a birthday in memory. AI reminder preview is active (early prototype).",
      data: { memoryId: item.id },
    }));

  if (!pendingInsert.length) {
    return 0;
  }

  await db.insert(notification).values(pendingInsert);
  return pendingInsert.length;
}
