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
      personalEvent: z
        .object({
          title: z
            .string()
            .min(2)
            .describe("Event title, like 'Concert with Alex'."),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .describe("Event date in YYYY-MM-DD."),
          time: z
            .string()
            .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
            .optional()
            .describe("Optional 24h event time (HH:mm)."),
          note: z
            .string()
            .optional()
            .describe("Optional extra context for the event memory."),
        })
        .optional()
        .describe(
          "Optional personal event alarm metadata. Include this to create an event that appears on the home Events Board countdown."
        ),
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
    execute: async ({
      rawText,
      tags,
      personalEvent,
      route,
      sourceUri,
      memoryKeyHint,
      intent,
    }) => {
      if (!session.user?.id) {
        throw new Error("Missing user session for saveMemory.");
      }

      const eventTags = personalEvent
        ? [
            "personal-event",
            `event-date:${personalEvent.date}`,
            ...(personalEvent.time ? [`event-time:${personalEvent.time}`] : []),
          ]
        : [];

      const mergedTags = Array.from(new Set([...(tags ?? []), ...eventTags]));
      const eventText = personalEvent
        ? `${personalEvent.title}${personalEvent.note ? ` — ${personalEvent.note}` : ""}`
        : rawText;

      const record = await createMemoryRecord({
        ownerId: session.user.id,
        sourceUri: sourceUri ?? `chat:${chatId}`,
        rawText: eventText,
        tags: mergedTags,
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
