import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getAgentConfigById } from "@/lib/ai/agents/registry";
import {
  getApprovedMemoriesByUserId,
  getChatsByIds,
} from "@/lib/db/queries";
import { MemoriesClient, type MemoryItem } from "./memories-client";

const parseChatId = (sourceUri: string) => {
  if (sourceUri.startsWith("chat:")) {
    const trimmed = sourceUri.slice("chat:".length).trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const match = sourceUri.match(/^chat:\/\/conversation\/([^#]+)/i);
  return match?.[1] ?? null;
};

const buildSource = (
  sourceUri: string,
  chatTitles: Map<string, string>
) => {
  const chatId = parseChatId(sourceUri);
  if (!chatId) {
    return {
      type: "unknown" as const,
      uri: sourceUri,
      label: sourceUri,
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

export default async function MemoriesPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (!session.user) {
    redirect("/api/auth/guest");
  }

  const memories = await getApprovedMemoriesByUserId({
    userId: session.user.id,
  });

  const chatIds = new Set<string>();
  for (const memory of memories) {
    const chatId = parseChatId(memory.sourceUri);
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

  const memoryItems: MemoryItem[] = memories.map((memory) => {
    const agentLabel =
      memory.agentLabel ??
      (memory.agentId
        ? getAgentConfigById(memory.agentId)?.label
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

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-8">
      <MemoriesClient memories={memoryItems} />
    </div>
  );
}
