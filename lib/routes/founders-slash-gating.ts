import {
  getRouteAccessMetadata,
  type RouteAccessMetadata,
} from "@/packages/shared-core/src";

const FREE_SLASH_ROUTES = new Set([
  "MyCarMindATO/Driver",
  "MyCarMindATO/DeliveryDriver",
  "MyCarMindATO/Traveler",
  "NAMC/Lore-Playground",
  "NAMC/Lore-Playground/App",
]);

export function getSlashRouteAccessMetadata(
  slashRoute: string | undefined
): RouteAccessMetadata {
  return getRouteAccessMetadata(requiresFoundersForSlashRoute(slashRoute));
}

export function requiresFoundersForSlashRoute(
  slashRoute: string | undefined
): boolean {
  if (!slashRoute?.includes("/")) {
    return false;
  }

  return !FREE_SLASH_ROUTES.has(slashRoute);
}

export { FREE_SLASH_ROUTES };
