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
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import { generateUUID } from "../utils";
import {
  atoFile,
  type Chat,
  chat,
  type DBMessage,
  document,
  entitlement,
  memory,
  message,
  redemption,
  redemptionCode,
  type Suggestion,
  stream,
  suggestion,
  type User,
  type UserLocation,
  unofficialAto,
  user,
  userLocation,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

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
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  routeKey,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  routeKey?: string | null;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      routeKey: routeKey ?? null,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
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
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

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
    // Import sql from drizzle-orm for LIKE queries
    const { sql } = await import("drizzle-orm");
    
    return await db
      .select()
      .from(memory)
      .where(
        and(
          eq(memory.ownerId, userId),
          eq(memory.isApproved, true),
          eq(memory.sourceType, "chat"),
          // Match routes that start with the project route (e.g., /MyCarMindATO/)
          sql`${memory.route} LIKE ${projectRoute + "%"}`
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

export async function createUnofficialAto({
  ownerUserId,
  name,
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

export async function updateUnofficialAtoSettings({
  id,
  ownerUserId,
  webSearchEnabled,
  fileSearchEnabled,
  fileUsageEnabled,
  fileStoragePath,
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
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

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
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
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
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
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
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
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
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
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

    const [updatedChat] = await db
      .update(chat)
      .set(updates)
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .returning();

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
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

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
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
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
    return await db.update(chat).set({ routeKey }).where(eq(chat.id, chatId));
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
