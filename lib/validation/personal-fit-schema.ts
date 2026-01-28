import { z } from "zod";

/**
 * MyFlowerAI Personal Fit Schema v1.0
 *
 * Private per-user schema for tracking how well a strain works for an individual.
 * See /schemas/myflowerai/personal-fit-v1.schema.json for JSON schema.
 * See /docs/myflowerai/personal-fit.md for full documentation.
 *
 * CRITICAL: Personal fit data is PRIVATE and must be stored in per-user
 * private storage (Supabase with RLS, local encrypted, or private namespace).
 * NEVER write personal fit data into public strain JSON files.
 */

// Privacy metadata
const PersonalFitPrivacySchema = z.object({
  storage_location: z.enum([
    "database_user_private",
    "local_encrypted",
    "private_namespace",
  ]),
  user_consent: z.boolean(),
});

/**
 * Personal Fit Schema v1.0
 *
 * Tracks how well a specific strain works for an individual user.
 */
export const PersonalFitSchemaV1_0 = z.object({
  schema_version: z.literal("1.0"),
  personal_fit_id: z.string(),
  strain_id: z.string(),
  privacy: PersonalFitPrivacySchema,
  rating_1to10: z.number().min(1).max(10).optional(),
  best_for: z.array(z.string()).optional(),
  avoid_for: z.array(z.string()).optional(),
  repeat_probability_0to1: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PersonalFitV1_0 = z.infer<typeof PersonalFitSchemaV1_0>;

/**
 * Union type for any supported personal fit schema version
 */
export const PersonalFitSchema = PersonalFitSchemaV1_0;

export type PersonalFit = z.infer<typeof PersonalFitSchema>;
