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
  type Chat,
  chat,
  customAgent,
  type CustomAgent,
  type DBMessage,
  document,
  memory,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
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

// Custom Agent queries

export async function getUserById({ id }: { id: string }) {
  try {
    const [foundUser] = await db.select().from(user).where(eq(user.id, id));
    return foundUser ?? null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get user by id");
  }
}

export async function updateUserFounderStatus({
  userId,
  isFounder,
}: {
  userId: string;
  isFounder: boolean;
}) {
  try {
    return await db
      .update(user)
      .set({ isFounder })
      .where(eq(user.id, userId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user founder status"
    );
  }
}

export async function updateUserCustomAtoCount({
  userId,
  customAtoCount,
}: {
  userId: string;
  customAtoCount: { month: string; count: number };
}) {
  try {
    return await db
      .update(user)
      .set({ customAtoCount })
      .where(eq(user.id, userId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user custom ATO count"
    );
  }
}

export async function createCustomAgent({
  userId,
  name,
  slash,
  systemPrompt,
  defaultVoiceId,
  defaultVoiceLabel,
  memoryScope,
  tools,
}: {
  userId: string;
  name: string;
  slash: string;
  systemPrompt?: string;
  defaultVoiceId?: string;
  defaultVoiceLabel?: string;
  memoryScope: "ato-only" | "hub-wide";
  tools?: string[];
}) {
  try {
    const [newAgent] = await db
      .insert(customAgent)
      .values({
        userId,
        name,
        slash,
        systemPrompt,
        defaultVoiceId,
        defaultVoiceLabel,
        memoryScope,
        tools: tools ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newAgent;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create custom agent"
    );
  }
}

export async function getCustomAgentsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(customAgent)
      .where(and(eq(customAgent.userId, userId), eq(customAgent.isActive, true)))
      .orderBy(desc(customAgent.lastUsedAt), desc(customAgent.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get custom agents by user id"
    );
  }
}

export async function getAllCustomAgents() {
  try {
    return await db
      .select()
      .from(customAgent)
      .where(eq(customAgent.isActive, true))
      .orderBy(desc(customAgent.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get all custom agents"
    );
  }
}

export async function getCustomAgentById({ id }: { id: string }) {
  try {
    const [agent] = await db
      .select()
      .from(customAgent)
      .where(eq(customAgent.id, id));
    return agent ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get custom agent by id"
    );
  }
}

export async function getCustomAgentBySlash({
  slash,
  userId,
}: {
  slash: string;
  userId: string;
}) {
  try {
    const [agent] = await db
      .select()
      .from(customAgent)
      .where(
        and(
          eq(customAgent.slash, slash),
          eq(customAgent.userId, userId),
          eq(customAgent.isActive, true)
        )
      );
    return agent ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get custom agent by slash"
    );
  }
}

export async function updateCustomAgent({
  id,
  userId,
  name,
  systemPrompt,
  defaultVoiceId,
  defaultVoiceLabel,
  memoryScope,
  tools,
}: {
  id: string;
  userId: string;
  name?: string;
  systemPrompt?: string;
  defaultVoiceId?: string;
  defaultVoiceLabel?: string;
  memoryScope?: "ato-only" | "hub-wide";
  tools?: string[];
}) {
  try {
    const updates: Partial<CustomAgent> = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (defaultVoiceId) updates.defaultVoiceId = defaultVoiceId;
    if (defaultVoiceLabel) updates.defaultVoiceLabel = defaultVoiceLabel;
    if (memoryScope) updates.memoryScope = memoryScope;
    if (tools) updates.tools = tools;

    const [updated] = await db
      .update(customAgent)
      .set(updates)
      .where(and(eq(customAgent.id, id), eq(customAgent.userId, userId)))
      .returning();

    return updated ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update custom agent"
    );
  }
}

export async function updateCustomAgentLastUsed({
  id,
  lastUsedAt,
}: {
  id: string;
  lastUsedAt: Date;
}) {
  try {
    return await db
      .update(customAgent)
      .set({ lastUsedAt })
      .where(eq(customAgent.id, id));
  } catch (error) {
    console.warn("Failed to update lastUsedAt for custom agent", id, error);
    return;
  }
}

export async function deleteCustomAgent({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    // Soft delete by setting isActive to false
    const [deleted] = await db
      .update(customAgent)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(customAgent.id, id), eq(customAgent.userId, userId)))
      .returning();

    return deleted ?? null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete custom agent"
    );
  }
}
