import {
  ROUTE_CONTRACT_FIXTURES,
  formatRoutePath,
  getRouteAccessMetadata,
  normalizeRouteKey,
  sanitizeRouteSegment,
} from "@/packages/shared-core/src";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const fixture of ROUTE_CONTRACT_FIXTURES) {
  const normalized = normalizeRouteKey(fixture.slashInput);
  const formatted = formatRoutePath(fixture.slashInput);

  assert(
    normalized === fixture.expected.normalizedKey,
    `fixture ${fixture.id}: normalized route key mismatch`
  );

  assert(
    formatted === fixture.expected.formattedRoute,
    `fixture ${fixture.id}: formatted route mismatch`
  );
}

const metadata = getRouteAccessMetadata(true);
assert(metadata.foundersOnly, "expected foundersOnly=true when input is true");
assert(metadata.isFreeRoute === false, "expected isFreeRoute=false when foundersOnly=true");

assert(
  sanitizeRouteSegment(" /Custom Garage_Bot// ") === "CustomGarage_Bot",
  "expected sanitizeRouteSegment to remove whitespace and invalid separators"
);

console.log("✅ shared route contract tests passed");
