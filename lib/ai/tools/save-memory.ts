import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { createMemory } from "@/lib/db/queries";

type SaveMemoryProps = {
  session: Session;
  route?: string;
  agentId?: string;
  agentLabel?: string;
  sourceUri?: string;
};

export const saveMemory = ({
  session,
  route,
  agentId,
  agentLabel,
  sourceUri,
}: SaveMemoryProps) =>
  tool({
    description:
      "Save a user-approved memory from the chat into long-term storage.",
    inputSchema: z.object({
      rawText: z.string().describe("The memory text to save."),
      route: z
        .string()
        .describe("Slash route context for the memory (e.g., MyCarMindATO).")
        .optional(),
      agentId: z
        .string()
        .describe("Agent identifier associated with the memory.")
        .optional(),
      agentLabel: z
        .string()
        .describe("Human-friendly agent label for the memory.")
        .optional(),
      sourceUri: z
        .string()
        .describe("Source URI for the memory (e.g., chat:1234).")
        .optional(),
    }),
    needsApproval: true,
    execute: async (input) => {
      if (!session.user?.id) {
        return { error: "Unauthorized" };
      }

      const resolvedRoute = input.route ?? route;
      const resolvedAgentId = input.agentId ?? agentId;
      const resolvedAgentLabel = input.agentLabel ?? agentLabel;
      const resolvedSourceUri = input.sourceUri ?? sourceUri ?? "chat:unknown";

      const approvedAt = new Date();
      const createdMemory = await createMemory({
        ownerId: session.user.id,
        rawText: input.rawText,
        route: resolvedRoute,
        agentId: resolvedAgentId,
        agentLabel: resolvedAgentLabel,
        sourceUri: resolvedSourceUri,
        sourceType: "chat",
        isApproved: true,
        approvedAt,
      });

      return {
        id: createdMemory?.id,
        route: resolvedRoute,
        agentId: resolvedAgentId,
        agentLabel: resolvedAgentLabel,
        sourceUri: resolvedSourceUri,
        message: "Memory saved.",
      };
    },
  });
