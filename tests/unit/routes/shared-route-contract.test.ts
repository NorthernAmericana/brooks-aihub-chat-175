import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ROUTE_CONTRACT_FIXTURES,
  formatRoutePath,
  getRouteAccessMetadata,
  normalizeRouteKey,
  sanitizeRouteSegment,
} from "@/packages/shared-core/src";

describe("shared route contract fixtures", () => {
  it("keeps hardcoded normalized and formatted outputs stable", () => {
    for (const fixture of ROUTE_CONTRACT_FIXTURES) {
      assert.equal(normalizeRouteKey(fixture.slashInput), fixture.expected.normalizedKey);
      assert.equal(formatRoutePath(fixture.slashInput), fixture.expected.formattedRoute);
    }
  });

  it("keeps metadata derivation contract stable", () => {
    const foundersMetadata = getRouteAccessMetadata(true);
    assert.deepEqual(foundersMetadata, {
      foundersOnly: true,
      isFreeRoute: false,
    });

    const freeMetadata = getRouteAccessMetadata(false);
    assert.deepEqual(freeMetadata, {
      foundersOnly: false,
      isFreeRoute: true,
    });
  });

  it("sanitizes custom route segment values consistently", () => {
    assert.equal(sanitizeRouteSegment(" /Custom Garage_Bot// "), "CustomGarage_Bot");
  });
});
