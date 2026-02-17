import assert from "node:assert/strict";
import test from "node:test";
import {
  EARLY_RELEASE_START_AT,
  getCountdownParts,
  getLaunchPhase,
  isEarlyRelease,
} from "@/lib/launch-config";

test("getLaunchPhase returns pre_early_release before launch", () => {
  const beforeLaunch = new Date(EARLY_RELEASE_START_AT.getTime() - 60_000);
  assert.equal(getLaunchPhase(beforeLaunch), "pre_early_release");
  assert.equal(isEarlyRelease(beforeLaunch), false);
});

test("getLaunchPhase returns early_release at or after launch", () => {
  const atLaunch = new Date(EARLY_RELEASE_START_AT.getTime());
  const afterLaunch = new Date(EARLY_RELEASE_START_AT.getTime() + 60_000);

  assert.equal(getLaunchPhase(atLaunch), "early_release");
  assert.equal(getLaunchPhase(afterLaunch), "early_release");
  assert.equal(isEarlyRelease(afterLaunch), true);
});

test("getCountdownParts is clamped to zero after launch", () => {
  const afterLaunch = new Date(EARLY_RELEASE_START_AT.getTime() + 3_600_000);
  const countdown = getCountdownParts(afterLaunch);

  assert.deepEqual(countdown, { days: 0, hours: 0, minutes: 0 });
});
