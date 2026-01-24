import { listAgentConfigs } from "@/lib/ai/agents/registry";

export type SlashAction = {
  slash: string;
  prompt: string;
  lastUsedAt: number;
};

const STORAGE_KEY = "recent-slash-actions";

export const normalizeSlash = (slash: string) =>
  slash
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

export function parseSlashAction(
  text: string,
  agentConfigs = listAgentConfigs()
): Omit<SlashAction, "lastUsedAt"> | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const match = trimmed.match(/^\/(.+?)\/\s*(.*)$/);
  if (!match) {
    return null;
  }

  const rawSlash = match[1];
  const prompt = match[2]?.trim() ?? "";
  const normalized = normalizeSlash(rawSlash);
  const resolvedSlash =
    agentConfigs.find((agent) => normalizeSlash(agent.slash) === normalized)
      ?.slash ?? rawSlash;

  return {
    slash: resolvedSlash,
    prompt,
  };
}

export function formatSlashAction(action: {
  slash: string;
  prompt: string;
}): string {
  const suffix = action.prompt ? ` ${action.prompt}` : "";
  return `/${action.slash}/${suffix}`;
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
  slash: string;
  prompt: string;
}): SlashAction[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = getStoredSlashActions();
  const normalizedSlash = normalizeSlash(action.slash);
  const promptKey = action.prompt.toLowerCase();
  const filtered = existing.filter(
    (item) =>
      normalizeSlash(item.slash) !== normalizedSlash ||
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
