import type { RouteSuggestion } from "@/lib/routes/types";

type UnknownRouteFeedback =
  | {
      kind: "fallback";
      message: string;
    }
  | {
      kind: "suggestions";
      suggestions: RouteSuggestion[];
      title: string;
    };

const UNKNOWN_ROUTE_FALLBACK_MESSAGE =
  "Route not found. Try typing `/` to browse available routes.";

export function getUnknownRouteFeedback(
  slash: string,
  suggestions: RouteSuggestion[]
): UnknownRouteFeedback {
  if (suggestions.length === 0) {
    return {
      kind: "fallback",
      message: UNKNOWN_ROUTE_FALLBACK_MESSAGE,
    };
  }

  return {
    kind: "suggestions",
    suggestions: suggestions.slice(0, 3),
    title: `Unknown route: /${slash}/. Try one of these:`,
  };
}

export { UNKNOWN_ROUTE_FALLBACK_MESSAGE };
