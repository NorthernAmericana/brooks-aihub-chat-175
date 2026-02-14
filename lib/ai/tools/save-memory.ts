import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import type { AgentConfig } from "@/lib/ai/agents/registry";
import { createMemoryRecord } from "@/lib/db/queries";

type SaveMemoryProps = {
  session: Session;
  chatId: string;
  agent: AgentConfig;
};

export const saveMemory = ({ session, chatId, agent }: SaveMemoryProps) =>
  tool({
    description:
      "Save a receipt-worthy memory from the current chat. Use this only after the user explicitly asks to save.",
    inputSchema: z.object({
      rawText: z.string().describe("The receipt-style memory text to save."),
      tags: z.array(z.string()).optional(),
      route: z
        .string()
        .optional()
        .describe("Slash route (e.g., /NAMC/). Defaults to the active route."),
      sourceUri: z
        .string()
        .optional()
        .describe("Optional source identifier; defaults to the current chat."),
      memoryKeyHint: z
        .string()
        .optional()
        .describe(
          "Optional stable key hint to version the same real-world fact over time."
        ),
      intent: z
        .enum(["new_fact", "update_fact"])
        .optional()
        .describe(
          "Optional save intent: new_fact creates a fresh fact; update_fact versions an existing fact."
        ),
    }),
    needsApproval: true,
    execute: async ({ rawText, tags, route, sourceUri, memoryKeyHint, intent }) => {
      if (!session.user?.id) {
        throw new Error("Missing user session for saveMemory.");
      }

      const record = await createMemoryRecord({
        ownerId: session.user.id,
        sourceUri: sourceUri ?? `chat:${chatId}`,
        rawText,
        tags,
        route: route ?? agent.slash,
        agentId: agent.id,
        agentLabel: agent.label,
        memoryKeyHint,
        intent,
      });

      return {
        id: record.id,
        route: record.route,
        agentId: record.agentId,
        agentLabel: record.agentLabel,
        rawText: record.rawText,
        tags: record.tags,
        sourceUri: record.sourceUri,
        memoryKey: record.memoryKey,
        memoryVersion: record.memoryVersion,
        supersedesMemoryId: record.supersedesMemoryId,
        validFrom: record.validFrom,
        validTo: record.validTo,
        approvedAt: record.approvedAt,
      };
    },
  });
