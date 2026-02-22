import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROMPT_LIBRARY_VERSION,
  myfloweraiPromptLibrary,
} from "@/lib/myflowerai/prompt-library";

describe("myfloweraiPromptLibrary", () => {
  it("ships all required prompt templates on a single version", () => {
    assert.deepEqual(Object.keys(myfloweraiPromptLibrary).sort(), [
      "non_diagnostic_cud_signal_summary",
      "personalized_harm_reduction_briefing",
      "session_extraction_strict_json",
      "uncertainty_aware_explanation",
    ]);

    for (const entry of Object.values(myfloweraiPromptLibrary)) {
      assert.equal(entry.version, PROMPT_LIBRARY_VERSION);
      assert.ok(entry.template.length > 0);
    }
  });

  it("includes required global guardrails in every template", () => {
    const requiredGuardrails = [
      "Never invent or estimate missing potency values or COA values.",
      "Never infer or claim user impairment from THC biomarker values alone.",
      "Always output unknown, missing, or unavailable data explicitly as 'unknown'.",
    ];

    for (const entry of Object.values(myfloweraiPromptLibrary)) {
      for (const guardrail of requiredGuardrails) {
        assert.ok(entry.guardrails.includes(guardrail));
      }

      assert.match(
        entry.template,
        /Never invent or estimate missing potency values or COA values\./,
      );
      assert.match(
        entry.template,
        /Never infer or claim user impairment from THC biomarker values alone\./,
      );
      assert.match(
        entry.template,
        /Always output unknown, missing, or unavailable data explicitly as "unknown"\./,
      );
    }
  });
});
