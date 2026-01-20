export type ParsedSlashCommand = {
  route: string | null;
  content: string;
  isHelp: boolean;
};

export function resolveActiveRoute(
  currentRoute: string,
  parsedRoute: string | null
) {
  return parsedRoute ?? currentRoute;
}

export const normalizeRoute = (route: string): string => {
  const trimmed = route.trim();
  if (!trimmed) {
    return "/hub";
  }

  const cleaned = trimmed.replace(/^\/+|\/+$/g, "").toLowerCase();
  return `/${cleaned}`;
};

export function parseSlashCommand(input: string): ParsedSlashCommand {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return {
      route: null,
      content: trimmed,
      isHelp: false,
    };
  }

  const match = trimmed.match(/^\/([^/\s]+)\/?(?:\s+|$)(.*)$/s);
  if (!match) {
    return {
      route: null,
      content: trimmed,
      isHelp: false,
    };
  }

  const token = match[1] ?? "";
  const content = (match[2] ?? "").trim();
  const normalizedToken = token.toLowerCase();

  if (normalizedToken === "help") {
    return {
      route: null,
      content,
      isHelp: true,
    };
  }

  return {
    route: normalizeRoute(token),
    content,
    isHelp: false,
  };
}
