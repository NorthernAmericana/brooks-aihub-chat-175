import { z } from "zod";

/**
 * MyFlowerAI Session Event Schema v1.0
 *
 * Research anchors used when shaping this model:
 * - "Exposure → Context → Outcomes"
 * - "time matters"
 * - "15/60/180 min"
 */

export const SESSION_EVENT_SCHEMA_VERSION = "1.0";

const UnknownNumber = z.union([z.number(), z.literal("unknown")]);
const UnknownScale0to10 = z.union([
  z.number().min(0).max(10),
  z.literal("unknown"),
]);

const IntervalOutcomeSchema = z.object({
  high_0_10: UnknownScale0to10,
  anxiety_0_10: UnknownScale0to10,
  paranoia_0_10: UnknownScale0to10,
  relaxation_0_10: UnknownScale0to10,
  focus_0_10: UnknownScale0to10,
  body_load_0_10: UnknownScale0to10,
  friction_0_10: UnknownScale0to10,
  notes: z.string().max(2000).optional(),
  adverse_event: z.enum([
    "unknown",
    "none",
    "panic",
    "vomiting",
    "chest_pain",
    "fall",
    "other",
  ]),
});

export const SessionEventSchemaV1_0 = z.object({
  schema_version: z.literal(SESSION_EVENT_SCHEMA_VERSION),
  occurred_at: z.string().datetime(),
  exposure: z.object({
    route: z.enum([
      "unknown",
      "smoke",
      "vape_flower",
      "vape_concentrate",
      "edible",
      "tincture",
      "other",
    ]),
    device: z.object({
      device_type: z.enum([
        "unknown",
        "joint",
        "pipe",
        "bong",
        "dry_herb_vape",
        "cart_vape",
        "dab_rig",
        "other",
      ]),
      temperature_celsius: UnknownNumber,
      puff_count: UnknownNumber,
      puff_duration_sec: UnknownNumber,
      breath_hold_sec: UnknownNumber,
    }),
    dose_estimate: z.object({
      mg_thc_ingested_or_inhaled: UnknownNumber,
      mg_thc_systemic_estimate: UnknownNumber,
      standard_thc_units_5mg: UnknownNumber,
      uncertainty: z.object({
        dose_ci_low: UnknownNumber,
        dose_ci_high: UnknownNumber,
        notes: z.string().max(2000).optional(),
      }),
    }),
  }),
  context: z.object({
    location_type: z.enum([
      "unknown",
      "home",
      "friend_home",
      "outdoors",
      "party",
      "car",
      "other",
    ]),
    social_context: z.enum([
      "unknown",
      "alone",
      "with_friends",
      "with_partner",
      "mixed",
      "other",
    ]),
    planned_activity_next_2h: z
      .array(
        z.enum([
          "unknown",
          "work",
          "creative",
          "gaming",
          "exercise",
          "sleep",
          "social",
          "errands",
          "other",
        ]),
      )
      .min(1),
    baseline_mood: z.object({
      valence_0_10: UnknownScale0to10,
      anxiety_0_10: UnknownScale0to10,
      stress_0_10: UnknownScale0to10,
      energy_0_10: UnknownScale0to10,
    }),
  }),
  outcomes: z.object({
    timepoints_min: z.tuple([z.literal(15), z.literal(60), z.literal(180)]),
    checkpoints: z.object({
      "15": IntervalOutcomeSchema,
      "60": IntervalOutcomeSchema,
      "180": IntervalOutcomeSchema,
    }),
    final: z.object({
      satisfaction_0_10: UnknownScale0to10,
      craving_relief_0_10: UnknownScale0to10,
    }),
  }),
  notes: z.string().max(4000).optional(),
});

export type SessionEventV1_0 = z.infer<typeof SessionEventSchemaV1_0>;
