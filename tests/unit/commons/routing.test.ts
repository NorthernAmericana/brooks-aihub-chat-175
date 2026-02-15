import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidCampfirePathValue,
  validateCampfirePath,
} from "@/lib/commons/routing";

describe("isValidCampfirePathValue", () => {
  it("accepts legacy DM email paths", () => {
    assert.equal(isValidCampfirePathValue("dm/friend@example.com"), true);
  });

  it("rejects email segments for non-dm paths", () => {
    assert.equal(
      isValidCampfirePathValue("community/friend@example.com"),
      false
    );
  });

  it("accepts valid single-segment paths", () => {
    assert.equal(isValidCampfirePathValue("general"), true);
  });

  it("accepts valid two-segment paths", () => {
    assert.equal(isValidCampfirePathValue("community/general"), true);
  });

  it("rejects empty path values", () => {
    assert.equal(isValidCampfirePathValue(""), false);
  });

  it("rejects reserved submit segment", () => {
    assert.equal(isValidCampfirePathValue("submit"), true);
    const validated = validateCampfirePath(["submit"]);
    assert.equal(validated.isValid, false);
  });

  it("rejects paths deeper than two segments", () => {
    assert.equal(isValidCampfirePathValue("a/b/c"), false);
  });

  it("rejects malformed dm email segment", () => {
    assert.equal(isValidCampfirePathValue("dm/not_an_email"), false);
  });
});

describe("validateCampfirePath", () => {
  it("accepts dm email route segments", () => {
    const result = validateCampfirePath(["dm", "friend@example.com"]);
    assert.equal(result.isValid, true);
  });

  it("rejects non-dm email route segments", () => {
    const result = validateCampfirePath(["community", "friend@example.com"]);
    assert.equal(result.isValid, false);
  });

  it("rejects reserved segments", () => {
    const result = validateCampfirePath(["submit"]);
    assert.equal(result.isValid, false);
  });

  it("rejects no segments", () => {
    const result = validateCampfirePath([]);
    assert.equal(result.isValid, false);
  });

  it("rejects more than two segments", () => {
    const result = validateCampfirePath(["one", "two", "three"]);
    assert.equal(result.isValid, false);
  });
});
