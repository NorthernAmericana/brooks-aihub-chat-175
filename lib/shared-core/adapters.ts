import type { Chat, DBMessage, Memory as DBMemory } from "@/lib/db/schema";
import type { Memory, Session, SessionTurn } from "@/packages/shared-core/src";

export function mapChatRowToSession(chat: Chat): Session {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    title: chat.title,
    userId: chat.userId,
    visibility: chat.visibility,
    routeKey: chat.routeKey,
    sessionType: chat.sessionType,
    ttsEnabled: chat.ttsEnabled,
    ttsVoiceId: chat.ttsVoiceId,
    ttsVoiceLabel: chat.ttsVoiceLabel,
  };
}

export function mapDbMessageToSessionTurn(message: DBMessage): SessionTurn {
  return {
    id: message.id,
    sessionId: message.chatId,
    role: message.role as SessionTurn["role"],
    parts: message.parts,
    attachments: message.attachments as SessionTurn["attachments"],
    createdAt: message.createdAt,
  };
}

export function mapMemoryRowToContract(memory: DBMemory): Memory {
  return {
    id: memory.id,
    memoryKey: memory.memoryKey,
    memoryVersion: memory.memoryVersion,
    supersedesMemoryId: memory.supersedesMemoryId,
    validFrom: memory.validFrom,
    validTo: memory.validTo,
    stalenessReason: memory.stalenessReason,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    sourceType: memory.sourceType,
    sourceUri: memory.sourceUri,
    ownerId: memory.ownerId,
    orgId: memory.orgId,
    productId: memory.productId,
    route: memory.route,
    agentId: memory.agentId,
    agentLabel: memory.agentLabel,
    isApproved: memory.isApproved,
    approvedAt: memory.approvedAt,
    tags: memory.tags,
    rawText: memory.rawText,
    normalizedText: memory.normalizedText,
    embeddingsRef: memory.embeddingsRef,
  };
}
