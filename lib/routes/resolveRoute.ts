import "server-only";

import {
  getUnofficialAtoByRoute,
  listRouteRegistryEntries,
} from "@/lib/db/queries";
import { formatRoutePath, normalizeRouteKey } from "@/lib/routes/utils";
import type { RouteSuggestion } from "@/lib/routes/types";

export type ResolvedRoute = RouteSuggestion;

export async function resolveRoute({
  route,
  ownerUserId,
}: {
  route: string;
  ownerUserId?: string;
}): Promise<ResolvedRoute | null> {
  const normalized = normalizeRouteKey(route);

  const officialRoutes = await listRouteRegistryEntries();
  const officialMatch = officialRoutes.find(
    (entry) => normalizeRouteKey(entry.slash) === normalized
  );

  if (officialMatch) {
    return {
      id: officialMatch.id,
      label: officialMatch.label,
      slash: officialMatch.slash,
      route: formatRoutePath(officialMatch.slash),
      kind: "official",
    };
  }

  if (!ownerUserId) {
    return null;
  }

  const unofficial = await getUnofficialAtoByRoute({
    ownerUserId,
    route,
  });

  if (!unofficial) {
    return null;
  }

  const routeSource = unofficial.route || unofficial.name;
  return {
    id: `custom-${unofficial.id}`,
    label: unofficial.name,
    slash: routeSource,
    route: formatRoutePath(routeSource),
    kind: "custom",
    atoId: unofficial.id,
  };
}
