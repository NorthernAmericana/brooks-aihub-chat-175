"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { getAgentConfigById } from "@/lib/ai/agents/registry";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  routeKey,
}: {
  message: UIMessage;
  routeKey?: string | null;
}) {
  const { text } = await generateText({
    model: getTitleModel(),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
  });
  const cleanedTitle = text
    .replace(/^[#*"\s]+/, "")
    .replace(/["]+$/, "")
    .trim();

  // Prefix with route for backward compatibility with voice system
  if (routeKey) {
    const agentConfig = await getAgentConfigById(routeKey);
    if (agentConfig) {
      return `/${agentConfig.slash}/ ${cleanedTitle}`;
    }
  }

  return cleanedTitle;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
