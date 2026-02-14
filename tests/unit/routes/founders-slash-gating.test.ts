import {
  FREE_SLASH_ROUTES,
  getSlashRouteAccessMetadata,
  requiresFoundersForSlashRoute,
} from "@/lib/routes/founders-slash-gating";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  FREE_SLASH_ROUTES.has("NAMC/Lore-Playground"),
  "expected NAMC/Lore-Playground to be in the free slash allowlist"
);

assert(
  requiresFoundersForSlashRoute("NAMC/Lore-Playground") === false,
  "expected non-founders to access NAMC/Lore-Playground"
);

assert(
  requiresFoundersForSlashRoute("MyCarMindATO/Driver") === false,
  "expected MyCarMindATO/Driver to remain free"
);


assert(
  FREE_SLASH_ROUTES.has("NAMC/Reader") === false,
  "expected NAMC/Reader to stay founders-only and not be allowlisted as free"
);

assert(
  requiresFoundersForSlashRoute("NAMC/Reader") === true,
  "expected founders-only subroute NAMC/Reader to remain protected"
);

const namcReaderAccess = getSlashRouteAccessMetadata("NAMC/Reader");
assert(
  namcReaderAccess.foundersOnly === true && namcReaderAccess.isFreeRoute === false,
  "expected NAMC/Reader route metadata to indicate founders-only access"
);

assert(
  requiresFoundersForSlashRoute("MyCarMindATO/Trucker") === true,
  "expected founders-only subroute MyCarMindATO/Trucker to remain protected"
);

assert(
  requiresFoundersForSlashRoute("BrooksBears/BenjaminBear") === true,
  "expected founders-only subroute BrooksBears/BenjaminBear to remain protected"
);

assert(
  requiresFoundersForSlashRoute("NAMC") === false,
  "expected top-level routes to not require founders in slash gating"
);

console.log("✅ founders slash gating tests passed");
