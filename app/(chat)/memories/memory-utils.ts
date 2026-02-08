import "server-only";

import { getAgentConfigById } from "@/lib/ai/agents/registry";
import { getChatsByIds } from "@/lib/db/queries";
import type { Memory } from "@/lib/db/schema";
import type { MemoryItem } from "./memories-client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseChatSource = (sourceUri: string) => {
  let candidate: string | null = null;
  let isChatSource = false;

  if (sourceUri.startsWith("chat:")) {
    const trimmed = sourceUri.slice("chat:".length).trim();
    isChatSource = true;
    candidate = trimmed.length > 0 ? trimmed : null;
  }

  const match = sourceUri.match(/^chat:\/\/conversation\/([^#]+)/i);
  if (match?.[1]) {
    isChatSource = true;
    candidate = match[1];
  }

  const chatId =
    candidate && UUID_REGEX.test(candidate) ? candidate : null;

  return { chatId, isChatSource };
};

const buildSource = (
  sourceUri: string,
  chatTitles: Map<string, string>
) => {
  const { chatId, isChatSource } = parseChatSource(sourceUri);
  if (!chatId) {
    return {
      type: isChatSource ? ("chat" as const) : ("unknown" as const),
      uri: sourceUri,
      label: isChatSource ? "Chat reference" : sourceUri,
      href: null,
    };
  }

  const chatTitle = chatTitles.get(chatId);
  return {
    type: "chat" as const,
    uri: sourceUri,
    label: chatTitle ? `Chat: ${chatTitle}` : "Chat conversation",
    href: `/chat/${chatId}`,
  };
};

export const buildMemoryItems = async (
  memories: Memory[]
): Promise<MemoryItem[]> => {
  const chatIds = new Set<string>();
  for (const memory of memories) {
    const { chatId } = parseChatSource(memory.sourceUri);
    if (chatId) {
      chatIds.add(chatId);
    }
  }

  const chats =
    chatIds.size > 0 ? await getChatsByIds({ ids: Array.from(chatIds) }) : [];
  const chatTitleMap = new Map<string, string>();
  for (const chat of chats) {
    chatTitleMap.set(chat.id, chat.title);
  }

  const agentIds = Array.from(
    new Set(memories.map((memory) => memory.agentId).filter(Boolean))
  ) as string[];
  const agentConfigs = await Promise.all(
    agentIds.map(async (id) => [id, await getAgentConfigById(id)] as const)
  );
  const agentConfigById = new Map(agentConfigs);

  return memories.map((memory) => {
    const agentLabel =
      memory.agentLabel ??
      (memory.agentId
        ? agentConfigById.get(memory.agentId)?.label
        : undefined) ??
      "Unknown agent";

    return {
      id: memory.id,
      rawText: memory.rawText,
      route: memory.route,
      agentLabel,
      approvedAt: (memory.approvedAt ?? memory.createdAt).toISOString(),
      createdAt: memory.createdAt.toISOString(),
      tags: memory.tags,
      source: buildSource(memory.sourceUri, chatTitleMap),
    };
  });
};
