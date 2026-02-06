const FREE_SLASH_ROUTES = new Set([
  "MyCarMindATO/Driver",
  "MyCarMindATO/DeliveryDriver",
  "MyCarMindATO/Traveler",
  "NAMC/Lore-Playground",
]);

export function getSlashRouteAccessMetadata(slashRoute: string | undefined): {
  foundersOnly: boolean;
  isFreeRoute: boolean;
} {
  const foundersOnly = requiresFoundersForSlashRoute(slashRoute);
  return {
    foundersOnly,
    isFreeRoute: !foundersOnly,
  };
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
