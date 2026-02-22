import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessSessionEventSafety } from "@/lib/myflowerai/session-event-safety";
import type { SessionEventV1_0 } from "@/lib/validation/session-event-schema";

const baseEvent: SessionEventV1_0 = {
  schema_version: "1.1",
  occurred_at: new Date().toISOString(),
  exposure: {
    route: "smoke",
    device: {
      device_type: "joint",
      temperature_celsius: "unknown",
      puff_count: 4,
      puff_duration_sec: "unknown",
      breath_hold_sec: "unknown",
    },
    dose_estimate: {
      mg_thc_ingested_or_inhaled: "unknown",
      mg_thc_systemic_estimate: "unknown",
      standard_thc_units_5mg: "unknown",
      uncertainty: {
        dose_ci_low: "unknown",
        dose_ci_high: "unknown",
      },
    },
  },
  context: {
    location_type: "home",
    social_context: "alone",
    planned_activity_next_2h: ["social"],
    baseline_mood: {
      valence_0_10: 5,
      anxiety_0_10: 2,
      stress_0_10: 3,
      energy_0_10: 5,
    },
    user_factors: {
      tolerance_self_rating_0to10: 4,
      use_history: {
        days_used_30d: 8,
        sessions_30d: 10,
      },
      motive_probabilities: {
        relief: 0.4,
        enhancement: 0.3,
        social: 0.2,
        sleep: 0.1,
        coping: 0.3,
      },
    },
  },
  expectancy: {
    expected_strength_0to10: 6,
    confidence_0to10: 7,
  },
  outcomes: {
    timepoints_min: [15, 60, 180],
    checkpoints: {
      "15": {
        high_0_10: 4,
        anxiety_0_10: 3,
        paranoia_0_10: 2,
        relaxation_0_10: 5,
        focus_0_10: 5,
        body_load_0_10: 2,
        friction_0_10: 2,
        adverse_event: "none",
      },
      "60": {
        high_0_10: 5,
        anxiety_0_10: 3,
        paranoia_0_10: 2,
        relaxation_0_10: 5,
        focus_0_10: 4,
        body_load_0_10: 3,
        friction_0_10: 3,
        adverse_event: "none",
      },
      "180": {
        high_0_10: 2,
        anxiety_0_10: 2,
        paranoia_0_10: 1,
        relaxation_0_10: 4,
        focus_0_10: 6,
        body_load_0_10: 1,
        friction_0_10: 1,
        adverse_event: "none",
      },
    },
    final: {
      satisfaction_0_10: 6,
      craving_relief_0_10: 6,
    },
  },
};

describe("assessSessionEventSafety", () => {
  it("keeps standard policy when no severe signals", () => {
    const standard = assessSessionEventSafety(baseEvent);

    assert.equal(standard.safetyFlag, false);
    assert.equal(standard.selectedPolicy, "standard_optimization_guidance");
    assert.equal(standard.audit.suppressedAdviceCategory, null);
  });

  it("flags acute anxiety/paranoia escalation", () => {
    const anxietyEscalation = assessSessionEventSafety({
      ...baseEvent,
      outcomes: {
        ...baseEvent.outcomes,
        checkpoints: {
          ...baseEvent.outcomes.checkpoints,
          "60": {
            ...baseEvent.outcomes.checkpoints["60"],
            anxiety_0_10: 8,
            paranoia_0_10: 8,
          },
        },
      },
    });

    assert.equal(anxietyEscalation.safetyFlag, true);
    assert.ok(
      anxietyEscalation.audit.triggerReasonCodes.includes(
        "acute_anxiety_paranoia_escalation",
      ),
    );
  });

  it("flags panic-like symptoms", () => {
    const panicSignal = assessSessionEventSafety({
      ...baseEvent,
      outcomes: {
        ...baseEvent.outcomes,
        checkpoints: {
          ...baseEvent.outcomes.checkpoints,
          "15": {
            ...baseEvent.outcomes.checkpoints["15"],
            adverse_event: "panic",
          },
        },
      },
    });

    assert.ok(
      panicSignal.audit.triggerReasonCodes.includes("panic_like_symptoms"),
    );
  });

  it("flags psychosis-like and vomiting pattern by notes", () => {
    const severeNotes = assessSessionEventSafety({
      ...baseEvent,
      notes:
        "I was hearing voices, felt detached from reality, and kept throwing up repeatedly.",
    });

    assert.ok(
      severeNotes.audit.triggerReasonCodes.includes("psychosis_like_experience"),
    );
    assert.ok(
      severeNotes.audit.triggerReasonCodes.includes(
        "severe_nausea_vomiting_pattern",
      ),
    );
    assert.equal(severeNotes.selectedPolicy, "safety_support_guidance");
    assert.equal(
      severeNotes.audit.suppressedAdviceCategory,
      "casual_optimization_advice",
    );
  });
});
