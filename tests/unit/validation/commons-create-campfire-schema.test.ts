import assert from "node:assert/strict";
import test from "node:test";
import { createCampfireSchema } from "@/lib/validation/commons-schema";

test("createCampfireSchema allows empty community name for auto-title", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "",
    description: "Autonamed campfire",
    campfirePath: "community/autonamed-campfire",
    retentionMode: "permanent",
  });

  assert.equal(parsed.success, true);
});

test("createCampfireSchema rejects temporary retention for community campfires", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "Launch Week",
    description: "A temporary launch campfire",
    campfirePath: "community/launch-week",
    retentionMode: "timeboxed",
    expiresInHours: 24,
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "retentionMode");
});

test("createCampfireSchema requires expiresInHours for temporary DM campfires", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "dm",
    retentionMode: "timeboxed",
    recipientEmails: ["friend@example.com"],
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "expiresInHours");
});

test("createCampfireSchema accepts temporary DM campfires with expiration", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "dm",
    retentionMode: "timeboxed",
    expiresInHours: 24,
    recipientEmails: ["friend@example.com"],
  });

  assert.equal(parsed.success, true);
});

test("createCampfireSchema rejects rolling_window retention for DM campfires", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "dm",
    retentionMode: "rolling_window",
    rollingWindowSize: 100,
    recipientEmails: ["friend@example.com"],
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "retentionMode");
});


test("createCampfireSchema rejects unsupported temporary DM duration values", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "dm",
    retentionMode: "timeboxed",
    expiresInHours: 25,
    recipientEmails: ["friend@example.com"],
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "expiresInHours");
});
