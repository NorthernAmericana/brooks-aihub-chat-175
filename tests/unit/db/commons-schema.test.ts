import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSql = readFileSync(
  "lib/db/migrations/0034_nat_commons_phase0.sql",
  "utf-8"
);

const hardeningMigrationSql = readFileSync(
  "lib/db/migrations/0035_nat_commons_phase0_hardening.sql",
  "utf-8"
);

test("commons votes enforces one-target-per-vote invariant", () => {
  assert.match(migrationSql, /commons_votes_single_target_chk/);
  assert.match(
    migrationSql,
    /\("post_id" IS NOT NULL AND "comment_id" IS NULL\) OR \("post_id" IS NULL AND "comment_id" IS NOT NULL\)/
  );
});

test("commons vote uniqueness constraints are partial for soft-delete compatibility", () => {
  assert.match(
    migrationSql,
    /commons_votes_post_user_unique_idx[\s\S]*WHERE "is_deleted" = false/
  );
  assert.match(
    migrationSql,
    /commons_votes_comment_user_unique_idx[\s\S]*WHERE "is_deleted" = false/
  );
  assert.match(hardeningMigrationSql, /DROP INDEX IF EXISTS "commons_votes_post_user_unique_idx"/);
  assert.match(
    hardeningMigrationSql,
    /CREATE UNIQUE INDEX IF NOT EXISTS "commons_votes_post_user_unique_idx"[\s\S]*WHERE "is_deleted" = false/
  );
});

test("commons timestamps use timestamptz", () => {
  assert.equal((migrationSql.match(/timestamptz/g) ?? []).length >= 10, true);
  assert.match(hardeningMigrationSql, /ALTER COLUMN "created_at" TYPE timestamptz/);
});

test("commons seed data includes at least 3 initial campfires", () => {
  const seedRows = [
    ...migrationSql.matchAll(
      /\('.*?', '.*?', '.*?', '.*?', (true|false), (true|false)\)/g
    ),
  ];
  assert.ok(seedRows.length >= 3);
});
