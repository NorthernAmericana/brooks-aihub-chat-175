import { assessSessionEventSafety } from "@/lib/myflowerai/session-event-safety";
import type { SessionEventV1_0 } from "@/lib/validation/session-event-schema";

const baseEvent: SessionEventV1_0 = {
  schema_version: "1.0",
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

console.log("Test 1: should keep standard policy when no severe signals");
const standard = assessSessionEventSafety(baseEvent);
console.assert(standard.safetyFlag === false, "safetyFlag should be false");
console.assert(
  standard.selectedPolicy === "standard_optimization_guidance",
  "should select standard optimization guidance",
);
console.assert(
  standard.audit.suppressedAdviceCategory === null,
  "should not suppress casual optimization advice",
);
console.log("✓ Test 1 passed");

console.log("\nTest 2: should flag acute anxiety/paranoia escalation");
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
console.assert(anxietyEscalation.safetyFlag, "safetyFlag should be true");
console.assert(
  anxietyEscalation.audit.triggerReasonCodes.includes(
    "acute_anxiety_paranoia_escalation",
  ),
  "should include anxiety/paranoia escalation reason",
);
console.log("✓ Test 2 passed");

console.log("\nTest 3: should flag panic-like symptoms");
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
console.assert(
  panicSignal.audit.triggerReasonCodes.includes("panic_like_symptoms"),
  "should include panic-like reason",
);
console.log("✓ Test 3 passed");

console.log("\nTest 4: should flag psychosis-like and vomiting pattern by notes");
const severeNotes = assessSessionEventSafety({
  ...baseEvent,
  notes:
    "I was hearing voices, felt detached from reality, and kept throwing up repeatedly.",
});
console.assert(
  severeNotes.audit.triggerReasonCodes.includes("psychosis_like_experience"),
  "should include psychosis-like reason",
);
console.assert(
  severeNotes.audit.triggerReasonCodes.includes("severe_nausea_vomiting_pattern"),
  "should include vomiting reason",
);
console.assert(
  severeNotes.selectedPolicy === "safety_support_guidance",
  "should switch to safety support guidance",
);
console.assert(
  severeNotes.audit.suppressedAdviceCategory === "casual_optimization_advice",
  "should suppress casual optimization advice",
);
console.log("✓ Test 4 passed");

console.log("\n✅ All session-event safety tests passed!");
