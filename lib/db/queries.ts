import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import {
  buildDbOperationCause,
  getDbErrorDetails,
  rethrowChatSdkErrorOrWrapDbError,
} from "./query-error-handling";
import { generateUUID } from "../utils";
import {
  assertChatRateLimitTablesReady,
  assertChatTableColumnsReady,
  db,
} from "./index";
import {
  atoApps,
  atoFile,
  atoRoutes,
  type Chat,
  chat,
  customAtos,
  type DBMessage,
  document,
  entitlement,
  memory,
  message,
  messageDeprecated,
  redemption,
  redemptionCode,
  routeRegistry,
  type Suggestion,
  storeProducts,
  stream,
  suggestion,
  type User,
  type UserLocation,
  type UserVehicle,
  unofficialAto,
  user,
  userInstalls,
  userLocation,
  userVehicle,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

async function withChatTableSchemaGuard<T>(operation: () => Promise<T>) {
  await assertChatTableColumnsReady();
  return operation();
}

type UserBirthdayColumnState = "unchecked" | "ready" | "failed";
let userBirthdayColumnState: UserBirthdayColumnState = "unchecked";
let userBirthdayColumnPromise: Promise<void> | null = null;

type UserMessageColorColumnState = "unchecked" | "ready" | "failed";
let userMessageColorColumnState: UserMessageColorColumnState = "unchecked";
let userMessageColorColumnPromise: Promise<void> | null = null;

type UserAvatarUrlColumnState = "unchecked" | "ready" | "failed";
let userAvatarUrlColumnState: UserAvatarUrlColumnState = "unchecked";
let userAvatarUrlColumnPromise: Promise<void> | null = null;

async function ensureUserBirthdayColumnReady() {
  if (userBirthdayColumnState === "ready") {
    return;
  }

  if (userBirthdayColumnState === "failed") {
    throw new ChatSDKError(
      "offline:database",
      'User table schema is missing "birthday". Run migrations and restart the service.'
    );
  }

  if (!userBirthdayColumnPromise) {
    userBirthdayColumnPromise = (async () => {
      const rows = await db.execute<{ column_name: string }>(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User';
      `);

      const hasBirthdayColumn = rows.some(
        (row) => row.column_name === "birthday"
      );

      if (!hasBirthdayColumn) {
        console.warn(
          '[DB SCHEMA CHECK] Auto-remediating missing public."User"."birthday" column. Run migrations to keep schema in sync.'
        );
        await db.execute(sql`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" varchar(10);
        `);
      }
    })()
      .then(() => {
        userBirthdayColumnState = "ready";
      })
      .catch((error) => {
        userBirthdayColumnState = "failed";
        throw error;
      });
  }

  await userBirthdayColumnPromise;
}

async function ensureUserMessageColorColumnReady() {
  if (userMessageColorColumnState === "ready") {
    return;
  }

  if (userMessageColorColumnState === "failed") {
    throw new ChatSDKError(
      "offline:database",
      'User table schema is missing "messageColor". Run migrations and restart the service.'
    );
  }

  if (!userMessageColorColumnPromise) {
    userMessageColorColumnPromise = (async () => {
      const rows = await db.execute<{ column_name: string }>(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User';
      `);

      const hasMessageColorColumn = rows.some(
        (row) => row.column_name === "messageColor"
      );

      if (!hasMessageColorColumn) {
        console.warn(
          '[DB SCHEMA CHECK] Auto-remediating missing public."User"."messageColor" column. Run migrations to keep schema in sync.'
        );
        await db.execute(sql`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messageColor" text;
        `);
      }
    })()
      .then(() => {
        userMessageColorColumnState = "ready";
      })
      .catch((error) => {
        userMessageColorColumnState = "failed";
        throw error;
      });
  }

  await userMessageColorColumnPromise;
}

async function ensureUserAvatarUrlColumnReady() {
  if (userAvatarUrlColumnState === "ready") {
    return;
  }

  if (userAvatarUrlColumnState === "failed") {
    throw new ChatSDKError(
      "offline:database",
      'User table schema is missing "avatarUrl". Run migrations and restart the service.'
    );
  }

  if (!userAvatarUrlColumnPromise) {
    userAvatarUrlColumnPromise = (async () => {
      const rows = await db.execute<{ column_name: string }>(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User';
      `);

      const hasAvatarUrlColumn = rows.some(
        (row) => row.column_name === "avatarUrl"
      );

      if (!hasAvatarUrlColumn) {
        console.warn(
          '[DB SCHEMA CHECK] Auto-remediating missing public."User"."avatarUrl" column. Run migrations to keep schema in sync.'
        );
        await db.execute(sql`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" text;
        `);
      }
    })()
      .then(() => {
        userAvatarUrlColumnState = "ready";
      })
      .catch((error) => {
        userAvatarUrlColumnState = "failed";
        throw error;
      });
  }

  await userAvatarUrlColumnPromise;
}

function logDbError({
  fn,
  operation,
  error,
}: {
  fn: string;
  operation: string;
  error: unknown;
}) {
  const details = getDbErrorDetails(error);
  console.error("[DB_ERROR]", {
    fn,
    operation,
    code: details.code,
    message: details.message,
  });

  return details;
}


export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    await ensureUserAvatarUrlColumnReady();
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  await ensureUserAvatarUrlColumnReady();
  const password = generateHashedPassword(generateUUID());
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const email = `guest-${Date.now()}-${generateUUID()}`;

    try {
      return await db.insert(user).values({ email, password }).returning({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      const { code } = getDbErrorDetails(error);

      if (code === "23505" && attempt < maxAttempts - 1) {
        continue;
      }

      rethrowChatSdkErrorOrWrapDbError({
        error,
        operation: "create guest user",
      });
    }
  }

  throw new ChatSDKError(
    "bad_request:database",
    "Failed to create guest user"
  );
}

export async function listRouteRegistryEntries() {
  try {
    return await db
      .select()
      .from(routeRegistry)
      .orderBy(asc(routeRegistry.label));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to list route registry entries"
    );
  }
}

export async function listStoreProducts() {
  try {
    return await db
      .select()
      .from(storeProducts)
      .orderBy(asc(storeProducts.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to list store products"
    );
  }
}
export async function saveChat({
  id,
  userId,
  title,
  visibility,
  routeKey,
  sessionType,
  ttsVoiceId,
  ttsVoiceLabel,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  routeKey?: string | null;
  sessionType?: "chat" | "video-call" | null;
  ttsVoiceId?: string | null;
  ttsVoiceLabel?: string | null;
}) {
  try {
    return await withChatTableSchemaGuard(() =>
      db.insert(chat).values({
        id,
        createdAt: new Date(),
        userId,
        title,
        visibility,
        routeKey: routeKey ?? null,
        sessionType: sessionType ?? "chat",
        ttsVoiceId: ttsVoiceId ?? null,
        ttsVoiceLabel: ttsVoiceLabel ?? null,
      })
    );
  } catch (error) {
    const details = logDbError({
      fn: "saveChat",
      operation: "insert_chat",
      error,
    });

    rethrowChatSdkErrorOrWrapDbError({
      error,
      operation: "save chat",
    });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await withChatTableSchemaGuard(() =>
      db.delete(chat).where(eq(chat.id, id)).returning()
    );
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await withChatTableSchemaGuard(() =>
      db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userId))
    );

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await withChatTableSchemaGuard(() =>
      db.delete(chat).where(eq(chat.userId, userId)).returning()
    );

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getApprovedMemoriesByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    return await db
      .select()
      .from(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat")
        )
      )
      .orderBy(desc(memory.approvedAt), desc(memory.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get approved memories"
    );
  }
}

export async function getApprovedMemoriesByUserIdAndRoute({
  userId,
  route,
}: {
  userId: string;
  route: string;
}) {
  try {
    return await db
      .select()
      .from(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat"),
          eq(memory.route, route)
        )
      )
      .orderBy(desc(memory.approvedAt), desc(memory.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get approved memories by route"
    );
  }
}

export async function getApprovedMemoriesByUserIdAndProjectRoute({
  userId,
  projectRoute,
}: {
  userId: string;
  projectRoute: string;
}) {
  try {
    const normalizedProjectRoute = projectRoute.startsWith("/")
      ? projectRoute.slice(1)
      : projectRoute;
    const baseProjectRoute = normalizedProjectRoute.replace(/\/$/, "");
    const slashedBaseProjectRoute = projectRoute.replace(/\/$/, "");
    return await db
      .select()
      .from(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat"),
          // Match routes that start with the project route (e.g., /MyCarMindATO/)
          or(
            sql`${memory.route} LIKE ${`${projectRoute}%`}`,
            sql`${memory.route} LIKE ${`${normalizedProjectRoute}%`}`,
            eq(memory.route, baseProjectRoute),
            eq(memory.route, slashedBaseProjectRoute)
          )
        )
      )
      .orderBy(desc(memory.approvedAt), desc(memory.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get approved memories by project route"
    );
  }
}

export async function deleteApprovedMemoriesByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    const deletedMemories = await db
      .delete(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat")
        )
      )
      .returning({ id: memory.id });

    return { deletedCount: deletedMemories.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete approved memories"
    );
  }
}

export async function deleteApprovedMemoriesByUserIdInRange({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  try {
    const deletedMemories = await db
      .delete(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat"),
          gte(memory.createdAt, startDate),
          lte(memory.createdAt, endDate)
        )
      )
      .returning({ id: memory.id });

    return { deletedCount: deletedMemories.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete approved memories by date range"
    );
  }
}

export async function createCustomAtoWithInstall({
  ownerUserId,
  name,
  route,
  description,
  personalityName,
  instructions,
  hasAvatar,
}: {
  ownerUserId: string;
  name: string;
  route: string;
  description?: string | null;
  personalityName?: string | null;
  instructions?: string | null;
  hasAvatar?: boolean;
}) {
  try {
    return await db.transaction(async (tx) => {
      const [customAto] = await tx
        .insert(customAtos)
        .values({
          ownerUserId,
          name,
          route,
          description: description ?? null,
          personalityName: personalityName ?? null,
          instructions: instructions ?? null,
          hasAvatar: hasAvatar ?? false,
        })
        .returning();

      if (!customAto) {
        return null;
      }

      const slugBase = route
        .toLowerCase()
        .replace(/[^a-z0-9-_/]/g, "")
        .replace(/\//g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const suffix = customAto.id.replace(/-/g, "").slice(0, 8);
      const appSlug = `custom-ato-${slugBase || "route"}-${suffix}`.slice(
        0,
        64
      );

      const [app] = await tx
        .insert(atoApps)
        .values({
          slug: appSlug,
          name,
          description: description ?? null,
          category: "Custom ATO",
          storePath: `/store/ato/${appSlug}`,
          appPath: `/custom/${route}/`,
          isOfficial: false,
        })
        .returning();

      if (!app) {
        return null;
      }

      await tx.insert(atoRoutes).values({
        appId: app.id,
        slash: `/custom/${route}/`,
        label: name,
        description: description ?? null,
        agentId: `custom-ato-${customAto.id}`,
        toolPolicy: {},
        isFoundersOnly: false,
      });

      await tx
        .insert(userInstalls)
        .values({ userId: ownerUserId, appId: app.id })
        .onConflictDoNothing();

      return { customAto, app };
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create custom ATO with install"
    );
  }
}

export async function createUnofficialAto({
  ownerUserId,
  name,
  route,
  description,
  personalityName,
  instructions,
  intelligenceMode,
  defaultVoiceId,
  defaultVoiceLabel,
  webSearchEnabled,
  fileSearchEnabled,
  fileUsageEnabled,
  fileStoragePath,
  planMetadata,
}: {
  ownerUserId: string;
  name: string;
  route?: string | null;
  description?: string | null;
  personalityName?: string | null;
  instructions?: string | null;
  intelligenceMode?: "Hive" | "ATO-Limited";
  defaultVoiceId?: string | null;
  defaultVoiceLabel?: string | null;
  webSearchEnabled?: boolean;
  fileSearchEnabled?: boolean;
  fileUsageEnabled?: boolean;
  fileStoragePath?: string | null;
  planMetadata?: Record<string, unknown> | null;
}) {
  try {
    const [record] = await db
      .insert(unofficialAto)
      .values({
        ownerUserId,
        name,
        route: route ?? null,
        description: description ?? null,
        personalityName: personalityName ?? null,
        instructions: instructions ?? null,
        intelligenceMode: intelligenceMode ?? "ATO-Limited",
        defaultVoiceId: defaultVoiceId ?? null,
        defaultVoiceLabel: defaultVoiceLabel ?? null,
        webSearchEnabled: webSearchEnabled ?? false,
        fileSearchEnabled: fileSearchEnabled ?? false,
        fileUsageEnabled: fileUsageEnabled ?? false,
        fileStoragePath: fileStoragePath ?? null,
        planMetadata: planMetadata ?? null,
      })
      .returning();

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create unofficial ATO"
    );
  }
}

export async function getUnofficialAtosByOwner({
  ownerUserId,
}: {
  ownerUserId: string;
}) {
  try {
    return await db
      .select()
      .from(unofficialAto)
      .where(eq(unofficialAto.ownerUserId, ownerUserId))
      .orderBy(desc(unofficialAto.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get unofficial ATOs"
    );
  }
}

export async function getUnofficialAtoCountByOwner({
  ownerUserId,
  createdAfter,
}: {
  ownerUserId: string;
  createdAfter?: Date;
}) {
  try {
    const conditions = [eq(unofficialAto.ownerUserId, ownerUserId)];
    if (createdAfter) {
      conditions.push(gte(unofficialAto.createdAt, createdAfter));
    }

    const [record] = await db
      .select({ value: count() })
      .from(unofficialAto)
      .where(and(...conditions));

    return Number(record?.value ?? 0);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get unofficial ATO usage count"
    );
  }
}

export async function getUnofficialAtoById({
  id,
  ownerUserId,
}: {
  id: string;
  ownerUserId: string;
}) {
  try {
    const [record] = await db
      .select()
      .from(unofficialAto)
      .where(
        and(
          eq(unofficialAto.id, id),
          eq(unofficialAto.ownerUserId, ownerUserId)
        )
      );

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get unofficial ATO"
    );
  }
}

export async function getUnofficialAtoByRoute({
  ownerUserId,
  route,
}: {
  ownerUserId: string;
  route: string;
}) {
  try {
    const normalizedRoute = route
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\s+/g, "")
      .replace(/\/{2,}/g, "/")
      .replace(/[^a-zA-Z0-9/_-]/g, "")
      .toLowerCase();
    const [record] = await db
      .select()
      .from(unofficialAto)
      .where(
        and(
          eq(unofficialAto.ownerUserId, ownerUserId),
          sql`lower(${unofficialAto.route}) = ${normalizedRoute}`
        )
      );

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get unofficial ATO by route"
    );
  }
}

export async function updateUnofficialAtoSettings({
  id,
  ownerUserId,
  webSearchEnabled,
  fileSearchEnabled,
  fileUsageEnabled,
  fileStoragePath,
  route,
  name,
  description,
  defaultVoiceId,
  defaultVoiceLabel,
  personalityName,
  instructions,
  planMetadata,
}: {
  id: string;
  ownerUserId: string;
  webSearchEnabled?: boolean;
  fileSearchEnabled?: boolean;
  fileUsageEnabled?: boolean;
  fileStoragePath?: string | null;
  route?: string | null;
  name?: string;
  description?: string | null;
  defaultVoiceId?: string | null;
  defaultVoiceLabel?: string | null;
  personalityName?: string | null;
  instructions?: string | null;
  planMetadata?: Record<string, unknown> | null;
}) {
  try {
    const updateValues: {
      webSearchEnabled?: boolean;
      fileSearchEnabled?: boolean;
      fileUsageEnabled?: boolean;
      fileStoragePath?: string | null;
      route?: string | null;
      name?: string;
      description?: string | null;
      defaultVoiceId?: string | null;
      defaultVoiceLabel?: string | null;
      personalityName?: string | null;
      instructions?: string | null;
      planMetadata?: Record<string, unknown> | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (typeof webSearchEnabled === "boolean") {
      updateValues.webSearchEnabled = webSearchEnabled;
    }

    if (typeof fileSearchEnabled === "boolean") {
      updateValues.fileSearchEnabled = fileSearchEnabled;
    }

    if (typeof fileUsageEnabled === "boolean") {
      updateValues.fileUsageEnabled = fileUsageEnabled;
    }

    if (typeof fileStoragePath !== "undefined") {
      updateValues.fileStoragePath = fileStoragePath;
    }

    if (typeof route !== "undefined") {
      updateValues.route = route;
    }

    if (typeof name === "string") {
      updateValues.name = name;
    }

    if (typeof description !== "undefined") {
      updateValues.description = description;
    }

    if (typeof defaultVoiceId !== "undefined") {
      updateValues.defaultVoiceId = defaultVoiceId;
    }

    if (typeof defaultVoiceLabel !== "undefined") {
      updateValues.defaultVoiceLabel = defaultVoiceLabel;
    }

    if (typeof personalityName !== "undefined") {
      updateValues.personalityName = personalityName;
    }

    if (typeof instructions !== "undefined") {
      updateValues.instructions = instructions;
    }

    if (typeof planMetadata !== "undefined") {
      updateValues.planMetadata = planMetadata;
    }

    const [record] = await db
      .update(unofficialAto)
      .set(updateValues)
      .where(
        and(
          eq(unofficialAto.id, id),
          eq(unofficialAto.ownerUserId, ownerUserId)
        )
      )
      .returning();

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update unofficial ATO"
    );
  }
}

export async function deleteUnofficialAto({
  id,
  ownerUserId,
}: {
  id: string;
  ownerUserId: string;
}) {
  try {
    await db
      .delete(atoFile)
      .where(and(eq(atoFile.atoId, id), eq(atoFile.ownerUserId, ownerUserId)));

    const [record] = await db
      .delete(unofficialAto)
      .where(
        and(
          eq(unofficialAto.id, id),
          eq(unofficialAto.ownerUserId, ownerUserId)
        )
      )
      .returning();

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete unofficial ATO"
    );
  }
}

export async function createAtoFile({
  atoId,
  ownerUserId,
  filename,
  blobUrl,
  blobPathname,
  contentType,
  enabled,
}: {
  atoId: string;
  ownerUserId: string;
  filename: string;
  blobUrl: string;
  blobPathname: string;
  contentType: string;
  enabled?: boolean;
}) {
  try {
    const [record] = await db
      .insert(atoFile)
      .values({
        atoId,
        ownerUserId,
        filename,
        blobUrl,
        blobPathname,
        contentType,
        enabled: enabled ?? true,
        createdAt: new Date(),
      })
      .returning();

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create ATO file");
  }
}

export async function getAtoFilesByAtoId({
  atoId,
  ownerUserId,
}: {
  atoId: string;
  ownerUserId: string;
}) {
  try {
    return await db
      .select()
      .from(atoFile)
      .where(
        and(eq(atoFile.atoId, atoId), eq(atoFile.ownerUserId, ownerUserId))
      )
      .orderBy(desc(atoFile.createdAt));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get ATO files");
  }
}

export async function getEnabledAtoFilesByAtoId({
  atoId,
  ownerUserId,
}: {
  atoId: string;
  ownerUserId: string;
}) {
  try {
    return await db
      .select()
      .from(atoFile)
      .where(
        and(
          eq(atoFile.atoId, atoId),
          eq(atoFile.ownerUserId, ownerUserId),
          eq(atoFile.enabled, true)
        )
      )
      .orderBy(desc(atoFile.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get enabled ATO files"
    );
  }
}

export async function updateAtoFileEnabled({
  id,
  atoId,
  ownerUserId,
  enabled,
}: {
  id: string;
  atoId: string;
  ownerUserId: string;
  enabled: boolean;
}) {
  try {
    const [record] = await db
      .update(atoFile)
      .set({ enabled })
      .where(
        and(
          eq(atoFile.id, id),
          eq(atoFile.atoId, atoId),
          eq(atoFile.ownerUserId, ownerUserId)
        )
      )
      .returning();

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update ATO file");
  }
}

export async function createMemoryRecord({
  ownerId,
  sourceUri,
  rawText,
  route,
  agentId,
  agentLabel,
  tags,
}: {
  ownerId: string;
  sourceUri: string;
  rawText: string;
  route?: string | null;
  agentId?: string | null;
  agentLabel?: string | null;
  tags?: string[];
}) {
  try {
    const [record] = await db
      .insert(memory)
      .values({
        ownerId,
        sourceType: "chat",
        sourceUri,
        route: route ?? null,
        agentId: agentId ?? null,
        agentLabel: agentLabel ?? null,
        rawText,
        tags: tags ?? [],
        isApproved: true,
        approvedAt: new Date(),
      })
      .returning();

    return record;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create memory record"
    );
  }
}

export async function createHomeLocationRecord({
  ownerId,
  chatId,
  route,
  rawText,
  normalizedText,
}: {
  ownerId: string;
  chatId: string;
  route: string;
  rawText: string;
  normalizedText?: string | null;
}) {
  try {
    const [record] = await db
      .insert(userLocation)
      .values({
        ownerId,
        chatId,
        route,
        locationType: "home-location",
        rawText,
        normalizedText: normalizedText ?? null,
        isApproved: true,
        approvedAt: new Date(),
      })
      .returning();

    return record;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create home location record"
    );
  }
}

export async function createVehicleRecord({
  ownerId,
  chatId,
  route,
  make,
  model,
  year,
}: {
  ownerId: string;
  chatId: string;
  route: string;
  make: string;
  model: string;
  year?: number | null;
}) {
  try {
    const [record] = await db
      .insert(userVehicle)
      .values({
        ownerId,
        chatId,
        route,
        make,
        model,
        year: year ?? null,
        isApproved: true,
        approvedAt: new Date(),
      })
      .returning();

    return record;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create vehicle record"
    );
  }
}

export async function getHomeLocationByUserId({
  userId,
  chatId,
  route,
}: {
  userId: string;
  chatId: string;
  route: string;
}): Promise<UserLocation | null> {
  try {
    const [record] = await db
      .select()
      .from(userLocation)
      .where(
        and(
          eq(userLocation.ownerId, userId),
          eq(userLocation.chatId, chatId),
          eq(userLocation.route, route),
          eq(userLocation.locationType, "home-location"),
          eq(userLocation.isApproved, true)
        )
      )
      .orderBy(desc(userLocation.updatedAt), desc(userLocation.createdAt))
      .limit(1);

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get home location"
    );
  }
}

export async function getHomeLocationByUserIdAndRoute({
  userId,
  route,
}: {
  userId: string;
  route: string;
}): Promise<UserLocation | null> {
  try {
    const [record] = await db
      .select()
      .from(userLocation)
      .where(
        and(
          eq(userLocation.ownerId, userId),
          eq(userLocation.route, route),
          eq(userLocation.locationType, "home-location"),
          eq(userLocation.isApproved, true)
        )
      )
      .orderBy(desc(userLocation.updatedAt), desc(userLocation.createdAt))
      .limit(1);

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get home location"
    );
  }
}

export async function getCurrentVehicleByUserIdAndRoute({
  userId,
  route,
}: {
  userId: string;
  route: string;
}): Promise<UserVehicle | null> {
  try {
    const [record] = await db
      .select()
      .from(userVehicle)
      .where(
        and(
          eq(userVehicle.ownerId, userId),
          eq(userVehicle.route, route),
          eq(userVehicle.isApproved, true)
        )
      )
      .orderBy(desc(userVehicle.updatedAt), desc(userVehicle.createdAt))
      .limit(1);

    return record ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get current vehicle"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      withChatTableSchemaGuard(() =>
        db
          .select()
          .from(chat)
          .where(
            whereCondition
              ? and(whereCondition, eq(chat.userId, id))
              : eq(chat.userId, id)
          )
          .orderBy(desc(chat.createdAt))
          .limit(extendedLimit)
      );

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await withChatTableSchemaGuard(() =>
        db.select().from(chat).where(eq(chat.id, startingAfter)).limit(1)
      );

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await withChatTableSchemaGuard(() =>
        db.select().from(chat).where(eq(chat.id, endingBefore)).limit(1)
      );

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    console.error("Failed to get chats by user id", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await withChatTableSchemaGuard(() =>
      db.select().from(chat).where(eq(chat.id, id))
    );
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    rethrowChatSdkErrorOrWrapDbError({
      error,
      operation: "get chat by id",
    });
  }
}

export async function getChatsByIds({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return [];
  }

  try {
    return await withChatTableSchemaGuard(() =>
      db
        .select({ id: chat.id, title: chat.title })
        .from(chat)
        .where(inArray(chat.id, ids))
    );
  } catch (error) {
    rethrowChatSdkErrorOrWrapDbError({
      error,
      operation: "get chats by ids",
    });
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    const details = logDbError({
      fn: "saveMessages",
      operation: "insert_messages",
      error,
    });

    throw new ChatSDKError(
      "bad_request:database",
      buildDbOperationCause({
        operation: "save messages",
        code: details.code,
        message: details.message,
      })
    );
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    const details = logDbError({
      fn: "getMessagesByChatId",
      operation: "select_messages_by_chat_id",
      error,
    });

    throw new ChatSDKError(
      "bad_request:database",
      buildDbOperationCause({
        operation: "get messages by chat id",
        code: details.code,
        message: details.message,
      })
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await withChatTableSchemaGuard(() =>
      db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await withChatTableSchemaGuard(() =>
      db.update(chat).set({ title }).where(eq(chat.id, chatId))
    );
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
    return;
  }
}

export async function updateChatTtsSettings({
  chatId,
  userId,
  ttsEnabled,
  ttsVoiceId,
  ttsVoiceLabel,
}: {
  chatId: string;
  userId: string;
  ttsEnabled?: boolean;
  ttsVoiceId?: string;
  ttsVoiceLabel?: string;
}) {
  try {
    const updates: Partial<Chat> = {};

    if (typeof ttsEnabled === "boolean") {
      updates.ttsEnabled = ttsEnabled;
    }
    if (typeof ttsVoiceId === "string") {
      updates.ttsVoiceId = ttsVoiceId;
    }
    if (typeof ttsVoiceLabel === "string") {
      updates.ttsVoiceLabel = ttsVoiceLabel;
    }

    if (Object.keys(updates).length === 0) {
      return null;
    }

    const [updatedChat] = await withChatTableSchemaGuard(() =>
      db
        .update(chat)
        .set(updates)
        .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
        .returning()
    );

    return updatedChat ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat TTS settings"
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  const twentyFourHoursAgo = new Date(
    Date.now() - differenceInHours * 60 * 60 * 1000
  );

  const isSchemaReadinessError = (error: unknown) => {
    if (error instanceof ChatSDKError) {
      return error.type === "offline" && error.surface === "database";
    }

    const databaseError = error as {
      code?: string;
      message?: string;
    };
    const code = databaseError?.code ?? "";

    return code === "42P01" || code === "42703";
  };

  try {
    await assertChatRateLimitTablesReady();

    try {
      const [stats] = await db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(
          and(
            eq(chat.userId, id),
            gte(message.createdAt, twentyFourHoursAgo),
            eq(message.role, "user")
          )
        )
        .execute();

      return stats?.count ?? 0;
    } catch (primaryError) {
      const primaryDbError = primaryError as {
        code?: string;
        message?: string;
      };
      console.error("[DB][getMessageCountByUserId] Message_v2 query failed", {
        code: primaryDbError?.code,
        message: primaryDbError?.message,
      });

      if (!isSchemaReadinessError(primaryError)) {
        throw primaryError;
      }

      const [fallbackStats] = await db
        .select({ count: count(messageDeprecated.id) })
        .from(messageDeprecated)
        .innerJoin(chat, eq(messageDeprecated.chatId, chat.id))
        .where(
          and(
            eq(chat.userId, id),
            gte(messageDeprecated.createdAt, twentyFourHoursAgo),
            eq(messageDeprecated.role, "user")
          )
        )
        .execute();

      return fallbackStats?.count ?? 0;
    }
  } catch (error) {
    const details = logDbError({
      fn: "getMessageCountByUserId",
      operation: "count_user_messages",
      error,
    });

    if (isSchemaReadinessError(error)) {
      throw new ChatSDKError(
        "offline:database",
        buildDbOperationCause({
          operation:
            "get message count by user id due to database schema readiness",
          code: details.code,
          message: details.message,
        })
      );
    }

    throw new ChatSDKError(
      "bad_request:database",
      buildDbOperationCause({
        operation: "get message count by user id",
        code: details.code,
        message: details.message,
      })
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

export async function updateChatRouteKey({
  chatId,
  routeKey,
}: {
  chatId: string;
  routeKey: string;
}) {
  try {
    return await withChatTableSchemaGuard(() =>
      db.update(chat).set({ routeKey }).where(eq(chat.id, chatId))
    );
  } catch (error) {
    console.warn("Failed to update routeKey for chat", chatId, error);
    return;
  }
}

// ===== Entitlements and Stripe =====

export async function updateUserStripeInfo({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  foundersAccess,
}: {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  foundersAccess?: boolean;
}) {
  try {
    const updates: Partial<User> = {};
    if (stripeCustomerId) {
      updates.stripeCustomerId = stripeCustomerId;
    }
    if (stripeSubscriptionId) {
      updates.stripeSubscriptionId = stripeSubscriptionId;
    }
    if (typeof foundersAccess === "boolean") {
      updates.foundersAccess = foundersAccess;
      if (foundersAccess) {
        updates.foundersAccessGrantedAt = new Date();
      }
    }

    return await db
      .update(user)
      .set(updates)
      .where(eq(user.id, userId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user stripe info"
    );
  }
}

export async function getUserById({ id }: { id: string }) {
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.id, id));
    return selectedUser ?? null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get user by id");
  }
}

export async function getUserBirthday({ userId }: { userId: string }) {
  try {
    await ensureUserBirthdayColumnReady();
    const [selectedUser] = await db
      .select({ birthday: user.birthday })
      .from(user)
      .where(eq(user.id, userId));
    return selectedUser?.birthday ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user birthday"
    );
  }
}

export async function updateUserBirthday({
  userId,
  birthday,
}: {
  userId: string;
  birthday: string | null;
}) {
  try {
    await ensureUserBirthdayColumnReady();
    const [updatedUser] = await db
      .update(user)
      .set({ birthday })
      .where(eq(user.id, userId))
      .returning({ birthday: user.birthday });
    return updatedUser?.birthday ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user birthday"
    );
  }
}

export async function getUserMessageColor({ userId }: { userId: string }) {
  try {
    await ensureUserMessageColorColumnReady();
    const [selectedUser] = await db
      .select({ messageColor: user.messageColor })
      .from(user)
      .where(eq(user.id, userId));
    return selectedUser?.messageColor ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user message color"
    );
  }
}

export async function updateUserMessageColor({
  userId,
  messageColor,
}: {
  userId: string;
  messageColor: string | null;
}) {
  try {
    await ensureUserMessageColorColumnReady();
    const [updatedUser] = await db
      .update(user)
      .set({ messageColor })
      .where(eq(user.id, userId))
      .returning({ messageColor: user.messageColor });
    return updatedUser?.messageColor ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user message color"
    );
  }
}

export async function getUserAvatarUrl({ userId }: { userId: string }) {
  try {
    await ensureUserAvatarUrlColumnReady();
    const [selectedUser] = await db
      .select({ avatarUrl: user.avatarUrl })
      .from(user)
      .where(eq(user.id, userId));
    return selectedUser?.avatarUrl ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user avatar url"
    );
  }
}

export async function updateUserAvatarUrl({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  try {
    await ensureUserAvatarUrlColumnReady();
    const [updatedUser] = await db
      .update(user)
      .set({ avatarUrl })
      .where(eq(user.id, userId))
      .returning({ avatarUrl: user.avatarUrl });
    return updatedUser?.avatarUrl ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user avatar url"
    );
  }
}

export async function createEntitlement({
  userId,
  productId,
  grantedBy,
  expiresAt,
  metadata,
}: {
  userId: string;
  productId: string;
  grantedBy: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await db
      .insert(entitlement)
      .values({
        userId,
        productId,
        grantedBy,
        expiresAt: expiresAt ?? null,
        metadata: metadata ?? null,
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create entitlement"
    );
  }
}

export async function updateEntitlementProgress({
  userId,
  productId,
  progress,
}: {
  userId: string;
  productId: string;
  progress: Record<string, unknown>;
}) {
  try {
    const [existing] = await db
      .select()
      .from(entitlement)
      .where(
        and(
          eq(entitlement.userId, userId),
          eq(entitlement.productId, productId)
        )
      )
      .orderBy(desc(entitlement.grantedAt))
      .limit(1);

    if (!existing) {
      throw new ChatSDKError(
        "bad_request:database",
        "Entitlement not found for progress update"
      );
    }

    const mergedMetadata = {
      ...(existing.metadata ?? {}),
      progress,
    };

    return await db
      .update(entitlement)
      .set({ metadata: mergedMetadata })
      .where(eq(entitlement.id, existing.id))
      .returning();
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update entitlement progress"
    );
  }
}

export async function getUserEntitlements({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(entitlement)
      .where(eq(entitlement.userId, userId))
      .orderBy(desc(entitlement.grantedAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user entitlements"
    );
  }
}

export async function hasEntitlement({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  try {
    const [result] = await db
      .select()
      .from(entitlement)
      .where(
        and(
          eq(entitlement.userId, userId),
          eq(entitlement.productId, productId)
        )
      )
      .limit(1);

    return !!result;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to check entitlement"
    );
  }
}

export async function createRedemptionCode({
  code,
  productId,
  expiresAt,
  maxRedemptions,
  metadata,
}: {
  code: string;
  productId: string;
  expiresAt?: Date;
  maxRedemptions?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await db
      .insert(redemptionCode)
      .values({
        code,
        productId,
        expiresAt: expiresAt ?? null,
        maxRedemptions: maxRedemptions ?? "1",
        metadata: metadata ?? null,
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create redemption code"
    );
  }
}

export async function getRedemptionCodeByCode({ code }: { code: string }) {
  try {
    const [result] = await db
      .select()
      .from(redemptionCode)
      .where(eq(redemptionCode.code, code))
      .limit(1);

    return result ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get redemption code"
    );
  }
}

export async function redeemCode({
  codeId,
  userId,
}: {
  codeId: string;
  userId: string;
}) {
  try {
    return await db
      .insert(redemption)
      .values({
        codeId,
        userId,
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to redeem code");
  }
}

export async function incrementCodeRedemptionCount({
  codeId,
}: {
  codeId: string;
}) {
  try {
    const [code] = await db
      .select()
      .from(redemptionCode)
      .where(eq(redemptionCode.id, codeId))
      .limit(1);

    if (!code) {
      throw new ChatSDKError("not_found:database", "Redemption code not found");
    }

    const currentCount = Number.parseInt(code.redemptionCount || "0", 10);
    const newCount = (currentCount + 1).toString();

    return await db
      .update(redemptionCode)
      .set({ redemptionCount: newCount })
      .where(eq(redemptionCode.id, codeId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to increment code redemption count"
    );
  }
}

export async function hasRedeemedCode({
  codeId,
  userId,
}: {
  codeId: string;
  userId: string;
}) {
  try {
    const [result] = await db
      .select()
      .from(redemption)
      .where(and(eq(redemption.codeId, codeId), eq(redemption.userId, userId)))
      .limit(1);

    return !!result;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to check code redemption"
    );
  }
}
