import "server-only";

import {
  normalizeRouteKey,
  type RouteSuggestion,
} from "@/packages/shared-core/src";
import {
  getUnofficialAtosByOwner,
  listRouteRegistryEntries,
} from "@/lib/db/queries";
import { getSlashRouteAccessMetadata } from "@/lib/routes/founders-slash-gating";
import {
  mapCustomAtoToRouteSuggestion,
  mapRouteRegistryToRouteSuggestion,
} from "@/lib/routes/types";

export async function suggestRoutes({
  prefix,
  ownerUserId,
}: {
  prefix?: string;
  ownerUserId?: string;
} = {}): Promise<RouteSuggestion[]> {
  const officialRoutes = await listRouteRegistryEntries();
  const routesByKey = new Map<string, RouteSuggestion>();

  for (const entry of officialRoutes) {
    const normalized = normalizeRouteKey(entry.slash);
    routesByKey.set(
      normalized,
      mapRouteRegistryToRouteSuggestion(
        entry,
        getSlashRouteAccessMetadata(entry.slash)
      )
    );
  }

  if (ownerUserId) {
    const customAtos = await getUnofficialAtosByOwner({ ownerUserId });
    for (const ato of customAtos) {
      const suggestion = mapCustomAtoToRouteSuggestion(ato);
      const normalized = normalizeRouteKey(suggestion.slash);
      if (routesByKey.has(normalized)) {
        continue;
      }
      routesByKey.set(normalized, suggestion);
    }
  }

  const suggestions = Array.from(routesByKey.values());

  if (!prefix) {
    return suggestions;
  }

  const normalizedPrefix = normalizeRouteKey(prefix).replace(/\/$/, "");
  const plainPrefix = prefix
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

  return suggestions.filter((suggestion) => {
    const suggestionKey = normalizeRouteKey(suggestion.slash);
    const suggestionPlain = suggestion.slash.toLowerCase();
    return (
      suggestionKey.startsWith(`${normalizedPrefix}/`) ||
      suggestionPlain.startsWith(plainPrefix)
    );
  });
}
