import "server-only";

import { getCustomAtosByUserId } from "@/lib/db/queries";
import type { CustomAto } from "@/lib/db/schema";
import type { AgentConfig } from "./registry";

/**
 * Convert a custom ATO to an AgentConfig
 */
export function customAtoToAgentConfig(ato: CustomAto): AgentConfig {
  const memoryPrompt = `
MEMORY & RECEIPTS
- When a slash-routed interaction produces a receipt-worthy outcome (summary, decision, or clear next step), ask the user if they want to save it as a memory.
- If the user says yes (or explicitly asks to save), call saveMemory with a short receipt-style summary and optional tags/route.
- Never call saveMemory without explicit user confirmation.
`;

  const basePrompt = ato.promptInstructions
    ? `${ato.promptInstructions}\n\n${memoryPrompt}`
    : `You are ${ato.name}, a custom AI assistant inside Brooks AI HUB.\n\n${memoryPrompt}`;

  return {
    id: `custom-${ato.id}`,
    label: ato.name,
    slash: ato.slashRoute,
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: basePrompt,
  };
}

/**
 * Get all agent configs including custom ATOs for a user
 */
export async function getAgentConfigsWithCustom(
  userId: string
): Promise<AgentConfig[]> {
  const { listAgentConfigs } = await import("./registry");
  const officialAgents = listAgentConfigs();

  try {
    const customAtos = await getCustomAtosByUserId(userId);
    const customAgentConfigs = customAtos.map(customAtoToAgentConfig);
    return [...officialAgents, ...customAgentConfigs];
  } catch (error) {
    console.error("Failed to load custom ATOs:", error);
    return officialAgents;
  }
}

/**
 * Get an agent config by slash, including custom ATOs
 */
export async function getAgentConfigBySlashWithCustom(
  slash: string,
  userId: string
): Promise<AgentConfig | undefined> {
  const { getAgentConfigBySlash } = await import("./registry");
  
  // First check official agents
  const officialAgent = getAgentConfigBySlash(slash);
  if (officialAgent) {
    return officialAgent;
  }

  // Then check custom ATOs
  try {
    const customAtos = await getCustomAtosByUserId(userId);
    const normalizeSlash = (s: string) =>
      s
        .replace(/^\/|\/$/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const normalized = normalizeSlash(slash);
    const matchingAto = customAtos.find(
      (ato) => normalizeSlash(ato.slashRoute) === normalized
    );

    if (matchingAto) {
      return customAtoToAgentConfig(matchingAto);
    }
  } catch (error) {
    console.error("Failed to load custom ATO by slash:", error);
  }

  return undefined;
}

/**
 * Get an agent config by ID, including custom ATOs
 */
export async function getAgentConfigByIdWithCustom(
  id: string,
  userId: string
): Promise<AgentConfig | undefined> {
  const { getAgentConfigById } = await import("./registry");
  
  // First check official agents
  const officialAgent = getAgentConfigById(id);
  if (officialAgent) {
    return officialAgent;
  }

  // Then check custom ATOs (custom IDs start with "custom-")
  if (id.startsWith("custom-")) {
    try {
      const customAtos = await getCustomAtosByUserId(userId);
      const atoId = id.replace("custom-", "");
      const matchingAto = customAtos.find((ato) => ato.id === atoId);

      if (matchingAto) {
        return customAtoToAgentConfig(matchingAto);
      }
    } catch (error) {
      console.error("Failed to load custom ATO by ID:", error);
    }
  }

  return undefined;
}
