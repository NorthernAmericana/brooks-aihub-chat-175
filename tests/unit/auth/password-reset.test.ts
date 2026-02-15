import assert from "node:assert/strict";
import test from "node:test";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenUsable,
} from "@/lib/password-reset-utils";

test("password reset token generation creates unique token strings", () => {
  const tokenA = generatePasswordResetToken();
  const tokenB = generatePasswordResetToken();

  assert.equal(tokenA.length, 64, "Token should be 64 hex chars");
  assert.equal(tokenB.length, 64, "Token should be 64 hex chars");
  assert.notEqual(tokenA, tokenB, "Generated tokens should be unique");
});

test("password reset token hashing is deterministic", () => {
  const tokenA = generatePasswordResetToken();
  const tokenB = generatePasswordResetToken();

  const hashA = hashPasswordResetToken(tokenA);
  const hashA2 = hashPasswordResetToken(tokenA);
  const hashB = hashPasswordResetToken(tokenB);

  assert.equal(hashA.length, 64, "SHA-256 hash should be 64 hex chars");
  assert.equal(hashA, hashA2, "Hashing the same token must be deterministic");
  assert.notEqual(
    hashA,
    hashB,
    "Different tokens should produce different hashes"
  );
});

test("password reset token usability handles expiration and single-use", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const future = new Date("2026-01-01T00:15:00.000Z");
  const past = new Date("2025-12-31T23:59:59.000Z");

  assert.equal(
    isPasswordResetTokenUsable({ expiresAt: future, usedAt: null, now }),
    true,
    "Future, unused token should be usable"
  );
  assert.equal(
    isPasswordResetTokenUsable({ expiresAt: past, usedAt: null, now }),
    false,
    "Expired token should not be usable"
  );
  assert.equal(
    isPasswordResetTokenUsable({
      expiresAt: future,
      usedAt: new Date("2026-01-01T00:05:00.000Z"),
      now,
    }),
    false,
    "Used token should not be reusable"
  );
});
