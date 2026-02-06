import "server-only";

import {
  getUnofficialAtosByOwner,
  listRouteRegistryEntries,
} from "@/lib/db/queries";
import { getSlashRouteAccessMetadata } from "@/lib/routes/founders-slash-gating";
import type { RouteSuggestion } from "@/lib/routes/types";
import { formatRoutePath, normalizeRouteKey } from "@/lib/routes/utils";

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
    routesByKey.set(normalized, {
      id: entry.id,
      label: entry.label,
      slash: entry.slash,
      route: formatRoutePath(entry.slash),
      kind: "official",
      ...getSlashRouteAccessMetadata(entry.slash),
    });
  }

  if (ownerUserId) {
    const customAtos = await getUnofficialAtosByOwner({ ownerUserId });
    for (const ato of customAtos) {
      const routeSource = ato.route || ato.name;
      const normalized = normalizeRouteKey(routeSource);
      if (routesByKey.has(normalized)) {
        continue;
      }
      routesByKey.set(normalized, {
        id: `custom-${ato.id}`,
        label: ato.name,
        slash: routeSource,
        route: formatRoutePath(routeSource),
        kind: "custom",
        atoId: ato.id,
        foundersOnly: false,
        isFreeRoute: true,
      });
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
