import type { AgentManifest } from "@/lib/ai/agents/registry";
import { parseSlashCommand } from "@/lib/ai/routing";

export type SlashAction = {
  route: string;
  prompt: string;
  lastUsedAt: number;
};

const STORAGE_KEY = "recent-slash-actions";

export const normalizeRoute = (route: string) =>
  route.replace(/^\/+|\/+$/g, "").replace(/\s+/g, "").toLowerCase();

export function parseSlashAction(
  text: string,
  agentConfigs: AgentManifest[] = []
): Omit<SlashAction, "lastUsedAt"> | null {
  const parsed = parseSlashCommand(text);
  if (!parsed.route) {
    return null;
  }

  const matchedRoute = agentConfigs.find(
    (agent) => normalizeRoute(agent.route) === normalizeRoute(parsed.route ?? "")
  )?.route;

  return {
    route: matchedRoute ?? parsed.route,
    prompt: parsed.content,
  };
}

export function formatSlashAction(action: {
  route: string;
  prompt: string;
}): string {
  const suffix = action.prompt ? ` ${action.prompt}` : "";
  return `${action.route}${suffix}`;
}

export function getStoredSlashActions(): SlashAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SlashAction[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function rememberSlashAction(action: {
  route: string;
  prompt: string;
}): SlashAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = getStoredSlashActions();
  const normalizedRoute = normalizeRoute(action.route);
  const promptKey = action.prompt.toLowerCase();
  const filtered = existing.filter(
    (item) =>
      normalizeRoute(item.route) !== normalizedRoute ||
      item.prompt.toLowerCase() !== promptKey
  );

  const updated = [
    {
      ...action,
      lastUsedAt: Date.now(),
    },
    ...filtered,
  ].slice(0, 12);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
