import "server-only";

import type { AgentToolId } from "./registry";
import { getAllCustomAgents } from "@/lib/db/queries";

export type CustomAgentConfig = {
  id: string;
  label: string;
  slash: string;
  tools: AgentToolId[];
  systemPromptOverride?: string;
  isCustom: true;
  userId: string;
};

export async function loadCustomAgentsFromDb(): Promise<CustomAgentConfig[]> {
  try {
    const customAgents = await getAllCustomAgents();

    return customAgents.map((agent) => ({
      id: agent.id,
      label: agent.name,
      slash: agent.slash,
      tools: (agent.tools as AgentToolId[]) ?? [],
      systemPromptOverride: agent.systemPrompt ?? undefined,
      isCustom: true as const,
      userId: agent.userId,
    }));
  } catch (error) {
    console.warn("Failed to load custom agents:", error);
    return [];
  }
}
