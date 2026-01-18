export type AgentToolId =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions";

export type AgentConfig = {
  id: string;
  label: string;
  slash: string;
  tools: AgentToolId[];
  systemPromptOverride?: string;
};

const agentRegistry: AgentConfig[] = [
  {
    id: "default",
    label: "Default",
    slash: "default",
    tools: [
      "getWeather",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
    ],
  },
];

export const defaultAgentId = "default";

export function listAgentConfigs(): AgentConfig[] {
  return agentRegistry;
}

export function getAgentConfigById(id: string): AgentConfig | undefined {
  return agentRegistry.find((agent) => agent.id === id);
}

export function getAgentConfigBySlash(slash: string): AgentConfig | undefined {
  const normalized = slash.startsWith("/") ? slash.slice(1) : slash;
  return agentRegistry.find((agent) => agent.slash === normalized);
}

export function getDefaultAgentConfig(): AgentConfig {
  return (
    getAgentConfigById(defaultAgentId) ??
    agentRegistry[0] ?? {
      id: defaultAgentId,
      label: "Default",
      slash: "default",
      tools: [],
    }
  );
}
