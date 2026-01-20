import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSlashCommand } from "../../lib/ai/routing";

describe("parseSlashCommand", () => {
  it("parses route + content", () => {
    const result = parseSlashCommand("/namc brainstorm a scene");
    assert.equal(result.route, "/namc");
    assert.equal(result.content, "brainstorm a scene");
    assert.equal(result.isHelp, false);
  });

  it("parses route-only switch", () => {
    const result = parseSlashCommand("/hub");
    assert.equal(result.route, "/hub");
    assert.equal(result.content, "");
    assert.equal(result.isHelp, false);
  });

  it("parses help", () => {
    const result = parseSlashCommand("/help");
    assert.equal(result.route, null);
    assert.equal(result.isHelp, true);
  });
});
