import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSql = readFileSync(
  "lib/db/migrations/0034_nat_commons_phase0.sql",
  "utf-8"
);

test("commons votes enforces one-target-per-vote invariant", () => {
  assert.match(migrationSql, /commons_votes_single_target_chk/);
  assert.match(
    migrationSql,
    /\("post_id" IS NOT NULL AND "comment_id" IS NULL\) OR \("post_id" IS NULL AND "comment_id" IS NOT NULL\)/
  );
});

test("commons vote uniqueness constraints exist for post and comment targets", () => {
  assert.match(migrationSql, /commons_votes_post_user_unique_idx/);
  assert.match(migrationSql, /commons_votes_comment_user_unique_idx/);
});

test("commons seed data includes at least 3 initial campfires", () => {
  const seedRows = [...migrationSql.matchAll(/\('.*?', '.*?', '.*?', '.*?', (true|false), (true|false)\)/g)];
  assert.ok(seedRows.length >= 3);
});
