import { z } from "zod";

/**
 * MyFlowerAI Session Log Schema v1.0
 *
 * PRIVATE USER DATA SCHEMA
 * This schema is for storing user session logs in PRIVATE storage only.
 * NEVER store this data in public strain JSON files.
 *
 * Storage locations:
 * - Supabase user-private tables
 * - Local encrypted storage
 * - Private JSON namespace (not committed to repo)
 *
 * See /docs/myflowerai/session-logging.md for full documentation.
 */

// Privacy metadata
const PrivacySchema = z.object({
  storage_location: z.enum([
    "supabase_user_private",
    "local_encrypted",
    "private_namespace",
  ]),
  user_consent: z.boolean(),
});

// Dose estimate
const DoseEstimateSchema = z
  .object({
    amount_g: z.number().min(0).optional(),
    confidence: z.enum(["exact", "approximate", "guess"]).optional(),
    notes: z.string().optional(),
  })
  .optional();

// Timing details
const TimingSchema = z
  .object({
    time_of_day: z
      .enum(["morning", "afternoon", "evening", "night"])
      .optional(),
    duration_minutes: z.number().min(0).optional(),
  })
  .optional();

// Context information
const ContextSchema = z
  .object({
    setting: z
      .enum(["home", "outdoors", "social", "work", "travel", "other"])
      .optional(),
    activity: z.string().optional(),
    mood_before: z.string().optional(),
    intention: z.string().optional(),
  })
  .optional();

// Pre-use expectancy details
const ExpectancySchema = z
  .object({
    expected_intensity_1to10: z.number().min(1).max(10).optional(),
    expected_effects: z.array(z.string()).optional(),
    confidence_1to10: z.number().min(1).max(10).optional(),
  })
  .optional();

// Normalized pre/post state metrics
const SessionStateSchema = z
  .object({
    craving_0to10: z.number().min(0).max(10).optional(),
    tension_0to10: z.number().min(0).max(10).optional(),
    anxiety_0to10: z.number().min(0).max(10).optional(),
    focus_0to10: z.number().min(0).max(10).optional(),
    "mood_valence_-5to5": z.number().min(-5).max(5).optional(),
  })
  .optional();

// Task impact after use
const TaskImpactSchema = z
  .object({
    productivity_impact: z
      .enum([
        "major_decrease",
        "slight_decrease",
        "no_change",
        "slight_increase",
        "major_increase",
      ])
      .optional(),
    memory_impact: z
      .enum([
        "major_worse",
        "slight_worse",
        "no_change",
        "slight_better",
        "major_better",
      ])
      .optional(),
    social_comfort_impact: z
      .enum([
        "major_decrease",
        "slight_decrease",
        "no_change",
        "slight_increase",
        "major_increase",
      ])
      .optional(),
  })
  .optional();

// Follow-up reflections
const FollowUpSchema = z
  .object({
    would_use_again: z.boolean().optional(),
    next_time_adjust: z.string().optional(),
  })
  .optional();

/**
 * Schema version constant
 */
export const SESSION_LOG_SCHEMA_VERSION = "1.0";

/**
 * Session Log Schema v1.0
 *
 * Complete schema for a single session log entry.
 */
export const SessionLogSchemaV1_0 = z.object({
  schema_version: z.literal(SESSION_LOG_SCHEMA_VERSION),
  session_id: z.string(),
  strain_id: z.string(),
  timestamp: z.string().datetime(),
  privacy: PrivacySchema,
  method: z.enum([
    "joint",
    "blunt",
    "pipe",
    "bong",
    "vaporizer_dry_herb",
    "vaporizer_concentrate",
    "edible",
    "tincture",
    "topical",
    "other",
  ]),
  dose_estimate: DoseEstimateSchema,
  timing: TimingSchema,
  context: ContextSchema,
  expectancy: ExpectancySchema,
  state_before: SessionStateSchema,
  state_after: SessionStateSchema,
  planned_tasks: z.array(z.string()).optional(),
  task_impact: TaskImpactSchema,
  effects_positive: z.array(z.string()).optional(),
  effects_negative: z.array(z.string()).optional(),
  intensity_1to10: z.number().min(1).max(10).optional(),
  outcome_tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  follow_up: FollowUpSchema,
});

export type SessionLogV1_0 = z.infer<typeof SessionLogSchemaV1_0>;

/**
 * Session Template Schema
 *
 * This is the PUBLIC schema that goes in strain files.
 * It provides guidance to the AI agent on what questions to ask
 * and how to structure session logs (which are stored privately).
 */
export const SessionTemplateSchema = z.object({
  suggested_methods: z
    .array(
      z.enum([
        "joint",
        "blunt",
        "pipe",
        "bong",
        "vaporizer_dry_herb",
        "vaporizer_concentrate",
        "edible",
        "tincture",
        "topical",
        "other",
      ]),
    )
    .optional(),
  suggested_dose_guidance_text: z.string().optional(),
  recommended_questions: z.array(z.string()).optional(),
});

export type SessionTemplate = z.infer<typeof SessionTemplateSchema>;

/**
 * Helper function to create a session template
 */
export function createSessionTemplate(
  methods?: SessionTemplate["suggested_methods"],
  doseGuidance?: string,
  questions?: string[],
): SessionTemplate {
  return {
    suggested_methods: methods,
    suggested_dose_guidance_text: doseGuidance,
    recommended_questions: questions,
  };
}

/**
 * Default recommended questions for session logging
 */
export const DEFAULT_SESSION_QUESTIONS = [
  "Before you used, what intensity and effects did you expect, and how confident were you (1-10)?",
  "Before you used, how would you rate craving, tension, anxiety, and focus (0-10), and mood valence (-5 to +5)?",
  "What method did you use to consume this strain?",
  "Approximately how much did you use?",
  "What time of day was it?",
  "What were you doing or planning to do?",
  "What tasks were you planning to do while/after using?",
  "What was your mood or intention going in?",
  "After use, how would you rate craving, tension, anxiety, and focus (0-10), and mood valence (-5 to +5)?",
  "How did use impact your productivity, memory, and social comfort?",
  "What positive effects did you notice?",
  "Were there any negative effects or side effects?",
  "On a scale of 1-10, how intense was the experience?",
  "Would you use this strain again in a similar situation?",
  "Any other notes or observations?",
];
