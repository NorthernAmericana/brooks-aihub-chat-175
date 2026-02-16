import type { RouteSuggestion } from "@/packages/shared-core/src";
import { formatRoutePath } from "@/lib/routes/utils";

export type { RouteKind, RouteSuggestion } from "@/packages/shared-core/src";

export function mapRouteRegistryToRouteSuggestion(
  route: { id: string; label: string; slash: string },
  metadata?: Pick<RouteSuggestion, "foundersOnly" | "isFreeRoute">
): RouteSuggestion {
  return {
    id: route.id,
    label: route.label,
    slash: route.slash,
    route: formatRoutePath(route.slash),
    kind: "official",
    ...metadata,
  };
}

export function mapCustomAtoToRouteSuggestion(ato: {
  id: string;
  name: string;
  route: string | null;
}): RouteSuggestion {
  const routeSource = ato.route || ato.name;

  return {
    id: `custom-${ato.id}`,
    label: ato.name,
    slash: routeSource,
    route: formatRoutePath(routeSource),
    kind: "custom",
    atoId: ato.id,
    foundersOnly: false,
    isFreeRoute: true,
  };
}
