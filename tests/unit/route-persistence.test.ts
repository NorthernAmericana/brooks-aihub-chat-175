import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSlashCommand, resolveActiveRoute } from "../../lib/ai/routing";

describe("route persistence", () => {
  it("keeps active route when subsequent messages lack slash", () => {
    const first = parseSlashCommand("/namc what is Ghost Girl");
    const activeRoute = resolveActiveRoute("/hub", first.route);

    const next = parseSlashCommand("brainstorm a scene");
    const nextRoute = resolveActiveRoute(activeRoute, next.route);

    assert.equal(activeRoute, "/namc");
    assert.equal(nextRoute, "/namc");
  });
});
