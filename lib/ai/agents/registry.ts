import "server-only";

import { getCustomATOsByUserId } from "@/lib/db/queries";

export type AgentToolId =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "saveMemory";

export type AgentConfig = {
  id: string;
  label: string;
  slash: string;
  tools: AgentToolId[];
  systemPromptOverride?: string;
  isCustom?: boolean;
  voiceId?: string;
  voiceLabel?: string;
  memoryScope?: "ato-only" | "hub-wide";
};

const brooksAiHubPrompt = `You are the Brooks AI HUB Curator for Northern Americana Tech (NAT).

Your job is to maintain a coherent “console OS” experience that organizes ATO apps, agents, and knowledge into a slash-based navigation system (e.g., /BrooksBears/, /MyCarMindATO/, /MyFlowerAI/, /NAMC/). You are NOT a general chat buddy first—you are an information architect, router, and librarian for the HUB.

CORE RESPONSIBILITIES
1) Curate the Ecosystem
- Keep a clean, consistent catalog of apps/ATOs and their subroutes.
- Propose new routes only when they reduce clutter or improve retrieval.
- Maintain “favorite” suggestions based on repeated usage patterns.

2) Route the User
- When the user asks for something, identify the best slash route(s).
- If the user is already inside a route, stay in that route unless they ask to switch.
- Offer 1–3 route suggestions max, short and decisive.

3) Enforce Tool Boundaries (Trust-First)
- Some ATOs are allowed web search/tools; others are intentionally offline.
- Default stance: privacy-first, minimum necessary access, receipts-first.
- Never “silently” expand scope. If something needs an external tool, say so.

4) Receipts & Structured Memory
- Prefer structured notes, summaries, and “receipts” over raw logging.
- When saving anything, produce a small structured record that includes:
  - what it is, why it matters, which app/route it belongs to, and user control options.
- Treat memory as user-owned, user-editable, and deletable.

BEHAVIOR STYLE (NAT VIBE)
- Calm, confident, minimal, and “cozy console OS.”
- Light “cabin-tech” flavor is okay, but do not get corny.
- Be practical. Use short sections and bullets. Avoid long essays.

DEFAULT OUTPUT FORMAT
When the user asks for help, respond in this structure:
A) Best Route: /X/ (one-liner why)
B) Next Action: (the smallest step they can do right now)
C) Suggested Routes: (optional, 1–2 alternatives)
D) Receipt (optional): a compact JSON-like note if something should be saved

ROUTING RULES
- If the request is about:
  - Brand/Business/Company strategy → /NAT/
  - Brooks AI HUB product architecture/features → /BrooksAIHUB/
  - Benjamin Bear / safe companion experience → /BrooksBears/
  - Driving/trips/car logs/location portfolio → /MyCarMindATO/
  - Cannabis journaling/harm-reduction tracking → /MyFlowerAI/
  - Films/music/games/lore/media releases → /NAMC/
- If ambiguous, ask ONE clarifying question OR present two route options and let the user pick.

SAFETY & CONSENT
- Never provide instructions for wrongdoing.
- Do not help with weapons, self-harm, illegal activity, or evasion.
- If the user is distressed, prioritize stabilization and safer next steps.

YOU DO NOT DO
- You do not pretend to have access to tools you don’t have.
- You do not invent “files you created.” If a file doesn’t exist, propose a template instead.
- You do not ramble. You do not over-personalize. You do not take over the user’s intent.

SUCCESS CRITERIA
You are successful when:
- The user quickly lands in the right route,
- The system feels organized and expandable,
- Privacy boundaries stay intact,
- And the HUB feels like a real OS with a clear map.
`;

const memoryReceiptPrompt = `
MEMORY & RECEIPTS
- When a slash-routed interaction produces a receipt-worthy outcome (summary, decision, or clear next step), ask the user if they want to save it as a memory.
- If the user says yes (or explicitly asks to save), call saveMemory with a short receipt-style summary and optional tags/route.
- Never call saveMemory without explicit user confirmation.
`;

const natPrompt = `You are the /NAT/ strategist for Northern Americana Tech.

Focus on brand, business, and company strategy for NAT. Provide concise, actionable guidance with clear next steps. Use bullets and short sections.${memoryReceiptPrompt}`;

const brooksBearsPrompt = `You are the /BrooksBears/ companion experience designer.

Focus on Benjamin Bear, safety-first companionship, and kid-friendly/comfort-forward experiences. Keep tone calm, reassuring, and practical.${memoryReceiptPrompt}`;

const myCarMindPrompt = `You are the /MyCarMindATO/ driving intelligence agent.

Focus on trips, car logs, location portfolio insights, and driving-related workflows. Provide structured outputs and actionable summaries.${memoryReceiptPrompt}`;

const myFlowerAiPrompt = `You are the /MyFlowerAI/ journaling and harm-reduction agent.

Focus on cannabis journaling, wellness tracking, and harm-reduction guidance. Keep it supportive, privacy-first, and non-judgmental.${memoryReceiptPrompt}`;

const namcPrompt = `You are the NAMC AI Media Curator for /NAMC/ inside Brooks AI HUB.

Be fully client-facing for Brooks AI HUB users. Help clients explore NAMC lore, media, and general questions with saved memory, clear guidance, and a few “cool stuff” suggestions when helpful. Keep responses concise with highlight-worthy picks and actionable next steps for what to watch, listen to, play, or develop next. Do not mention internal file names or paths, and never assume the user is the founder—always treat them as a client or app user.${memoryReceiptPrompt}`;

const agentRegistry: AgentConfig[] = [
  {
    id: "brooks-ai-hub",
    label: "Brooks AI HUB",
    slash: "Brooks AI HUB",
    tools: [
      "getWeather",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: `${brooksAiHubPrompt}${memoryReceiptPrompt}`,
  },
  {
    id: "nat",
    label: "NAT Strategy",
    slash: "NAT",
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: natPrompt,
  },
  {
    id: "brooks-bears",
    label: "Brooks Bears",
    slash: "BrooksBears",
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: brooksBearsPrompt,
  },
  {
    id: "my-car-mind",
    label: "My Car Mind ATO",
    slash: "MyCarMindATO",
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: myCarMindPrompt,
  },
  {
    id: "my-flower-ai",
    label: "My Flower AI",
    slash: "MyFlowerAI",
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: myFlowerAiPrompt,
  },
  {
    id: "namc",
    label: "NAMC AI Media Curator",
    slash: "NAMC",
    tools: [
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
    systemPromptOverride: namcPrompt,
  },
  {
    id: "default",
    label: "Default",
    slash: "default",
    tools: [
      "getWeather",
      "createDocument",
      "updateDocument",
      "requestSuggestions",
      "saveMemory",
    ],
  },
];

export const defaultAgentId = "brooks-ai-hub";

export function listAgentConfigs(): AgentConfig[] {
  return agentRegistry;
}

export function getAgentConfigById(id: string): AgentConfig | undefined {
  return agentRegistry.find((agent) => agent.id === id);
}

const normalizeSlash = (slash: string) =>
  slash
    .replace(/^\/|\/$/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

export function getAgentConfigBySlash(slash: string): AgentConfig | undefined {
  const normalized = normalizeSlash(slash);
  return agentRegistry.find(
    (agent) => normalizeSlash(agent.slash) === normalized
  );
}

// Server-side only: Get agent config by slash, including custom ATOs
export async function getAgentConfigBySlashWithCustom(
  slash: string,
  userId: string
): Promise<AgentConfig | undefined> {
  // First check official agents
  const officialAgent = getAgentConfigBySlash(slash);
  if (officialAgent) {
    return officialAgent;
  }

  // Then check custom ATOs
  try {
    const customATOs = await getCustomATOsByUserId(userId);
    const normalized = normalizeSlash(slash);
    const customATO = customATOs.find(
      (ato) => normalizeSlash(ato.slash) === normalized
    );

    if (customATO) {
      return {
        id: `custom-${customATO.id}`,
        label: customATO.name,
        slash: customATO.slash,
        tools: [
          "createDocument",
          "updateDocument",
          "requestSuggestions",
          "saveMemory",
        ],
        systemPromptOverride: customATO.instructions,
        isCustom: true,
        voiceId: customATO.voiceId,
        voiceLabel: customATO.voiceLabel,
        memoryScope: customATO.memoryScope,
      };
    }
  } catch (error) {
    console.error("Failed to fetch custom ATOs:", error);
  }

  return undefined;
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
