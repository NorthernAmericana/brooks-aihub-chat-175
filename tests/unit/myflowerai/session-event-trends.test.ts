import { buildSessionEventTrendReport } from "@/lib/myflowerai/session-event-trends";
import type { SessionEventV1_0 } from "@/lib/validation/session-event-schema";

function buildEvent(index: number): SessionEventV1_0 {
  return {
    schema_version: "1.1",
    occurred_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    exposure: {
      route: "smoke",
      device: {
        device_type: "joint",
        temperature_celsius: "unknown",
        puff_count: 3,
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
      planned_activity_next_2h: ["creative"],
      baseline_mood: {
        valence_0_10: 5,
        anxiety_0_10: 2,
        stress_0_10: 3,
        energy_0_10: 5,
      },
      user_factors: {
        tolerance_self_rating_0to10: 3 + index,
        use_history: {
          days_used_30d: 6 + index,
          sessions_30d: 8 + index,
          last_use_at: new Date(Date.UTC(2025, 11, index + 31)).toISOString(),
        },
        motive_probabilities: {
          relief: 0.2 + index * 0.1,
          enhancement: 0.3 + index * 0.1,
          social: 0.1,
          sleep: 0.2,
          coping: 0.15 + index * 0.1,
        },
      },
    },
    expectancy: {
      expected_strength_0to10: 4 + index,
      confidence_0to10: 7,
    },
    outcomes: {
      timepoints_min: [15, 60, 180],
      checkpoints: {
        "15": {
          high_0_10: 4 + index,
          anxiety_0_10: 3 + index,
          paranoia_0_10: 1,
          relaxation_0_10: 4,
          focus_0_10: 5,
          body_load_0_10: 2,
          friction_0_10: 2,
          adverse_event: "none",
        },
        "60": {
          high_0_10: 5 + index,
          anxiety_0_10: 3 + index,
          paranoia_0_10: 2,
          relaxation_0_10: 5,
          focus_0_10: 4,
          body_load_0_10: 2,
          friction_0_10: 2,
          adverse_event: "none",
        },
        "180": {
          high_0_10: 3 + index,
          anxiety_0_10: 2 + index,
          paranoia_0_10: 1,
          relaxation_0_10: 6,
          focus_0_10: 5,
          body_load_0_10: 2,
          friction_0_10: 1,
          adverse_event: "none",
        },
      },
      final: {
        satisfaction_0_10: 5 + index,
        craving_relief_0_10: 4 + index,
      },
    },
  };
}

const report = buildSessionEventTrendReport([
  buildEvent(0),
  buildEvent(1),
  buildEvent(2),
  buildEvent(3),
]);

console.assert(report.sample_size === 4, "sample_size should be 4");
console.assert(
  report.baseline_profile.tolerance_self_rating_0to10 !== null,
  "baseline tolerance should be computed",
);
console.assert(
  report.within_person_associations.length > 0,
  "within-person associations should be returned for sufficient samples",
);
console.assert(
  report.caveats[0]?.includes("within-person associations"),
  "report should include non-causal caveat language",
);

console.log("✅ Session event trend report tests passed");
