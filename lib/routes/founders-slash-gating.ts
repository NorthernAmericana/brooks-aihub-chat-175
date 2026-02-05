const FREE_SLASH_ROUTES = new Set([
  "MyCarMindATO/Driver",
  "MyCarMindATO/DeliveryDriver",
  "MyCarMindATO/Traveler",
  "NAMC/Lore-Playground",
]);

export function requiresFoundersForSlashRoute(
  slashRoute: string | undefined
): boolean {
  if (!slashRoute?.includes("/")) {
    return false;
  }

  return !FREE_SLASH_ROUTES.has(slashRoute);
}

export { FREE_SLASH_ROUTES };
