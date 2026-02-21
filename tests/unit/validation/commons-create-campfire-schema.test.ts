import assert from "node:assert/strict";
import test from "node:test";
import { createCampfireSchema } from "@/lib/validation/commons-schema";

test("createCampfireSchema requires rollingWindowSize for rolling_window community campfires", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "Builders Circle",
    description: "A campfire for builders",
    campfirePath: "community/builders-circle",
    retentionMode: "rolling_window",
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "rollingWindowSize");
});

test("createCampfireSchema requires expiresInHours for timeboxed community campfires", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "Launch Week",
    description: "A temporary launch campfire",
    campfirePath: "community/launch-week",
    retentionMode: "timeboxed",
  });

  assert.equal(parsed.success, false);
  if (parsed.success) {
    return;
  }

  assert.equal(parsed.error.issues[0]?.path.join("."), "expiresInHours");
});

test("createCampfireSchema accepts rolling_window when rollingWindowSize is provided", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "Signal Room",
    description: "Keep only the latest posts",
    campfirePath: "community/signal-room",
    retentionMode: "rolling_window",
    rollingWindowSize: 100,
  });

  assert.equal(parsed.success, true);
});

test("createCampfireSchema accepts timeboxed when expiresInHours is provided", () => {
  const parsed = createCampfireSchema.safeParse({
    mode: "community",
    name: "Sprint Wrap-up",
    description: "Expires after a day",
    campfirePath: "community/sprint-wrapup",
    retentionMode: "timeboxed",
    expiresInHours: 24,
  });

  assert.equal(parsed.success, true);
});
