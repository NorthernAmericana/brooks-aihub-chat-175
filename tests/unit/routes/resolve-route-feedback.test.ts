import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getUnknownRouteFeedback,
  UNKNOWN_ROUTE_FALLBACK_MESSAGE,
} from "@/lib/routes/resolve-route-feedback";

test("unknown route with suggestions returns suggestion feedback", () => {
  const feedback = getUnknownRouteFeedback("unknown route", [
    {
      id: "brooks-ai-hub",
      label: "Brooks AI HUB",
      slash: "Brooks AI HUB",
      route: "/brooks-ai-hub",
      kind: "official",
    },
  ]);

  assert.equal(feedback.kind, "suggestions");
  if (feedback.kind === "suggestions") {
    assert.equal(feedback.suggestions.length, 1);
    assert.equal(
      feedback.title,
      "Unknown route: /unknown route/. Try one of these:"
    );
  }
});

test("unknown route with no suggestions returns fallback feedback", () => {
  const feedback = getUnknownRouteFeedback("missing", []);

  assert.equal(feedback.kind, "fallback");
  if (feedback.kind === "fallback") {
    assert.equal(feedback.message, UNKNOWN_ROUTE_FALLBACK_MESSAGE);
  }
});
