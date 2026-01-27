import { z } from "zod";

/**
 * MyFlowerAI User Inventory Schema v1.0
 * 
 * PRIVACY NOTICE:
 * This schema defines PRIVATE user inventory data that MUST be stored in
 * per-user private storage (Supabase with RLS, local encrypted storage, or
 * private JSON namespace). NEVER commit inventory data to public repository
 * or add it to public strain JSON files.
 * 
 * For public strain data, use the `freshness_guidance` and `packaging` fields
 * in the strain schema instead.
 */

export const UserInventorySchemaV1_0 = z.object({
  schema_version: z.literal("1.0"),
  inventory_id: z.string().describe("Unique identifier for this inventory record (UUID recommended)"),
  strain_id: z.string().describe("Reference to public strain data ID"),
  
  privacy: z.object({
    storage_location: z.enum([
      "database_user_private",
      "local_encrypted", 
      "private_namespace"
    ]).describe("Where this inventory data is stored"),
    user_consent: z.boolean().describe("Whether user has consented to inventory tracking"),
  }),

  // Acquisition date with month granularity only (YYYY-MM)
  acquired_month: z.string()
    .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .describe("Month when product was acquired in YYYY-MM format (month granularity only for privacy)"),

  opened: z.boolean()
    .default(false)
    .describe("Whether the product container has been opened"),

  // Bucketed amount estimate (not exact grams)
  remaining_estimate: z.enum(["full", "half", "low", "empty"])
    .optional()
    .describe("Bucketed estimate of remaining amount (not exact grams for privacy)"),

  storage_type: z.enum([
    "glass_jar_airtight",
    "original_container",
    "cvault",
    "mason_jar",
    "plastic_container",
    "other"
  ]).optional()
    .describe("Type of storage container being used"),

  storage_conditions: z.object({
    has_humidipack: z.boolean().optional()
      .describe("Whether a humidity control pack is being used"),
    location: z.enum([
      "dark_cool_place",
      "drawer", 
      "cabinet",
      "fridge",
      "other"
    ]).optional()
      .describe("General storage location type (not specific address)"),
  }).optional(),

  quality_notes: z.string().optional()
    .describe("Freeform notes about current quality, freshness, or condition"),

  tags: z.array(z.string()).optional()
    .describe("User-defined tags for organizing inventory"),

  created_at: z.string().datetime().optional()
    .describe("When this inventory record was created (ISO 8601)"),

  updated_at: z.string().datetime().optional()
    .describe("When this inventory record was last updated (ISO 8601)"),
});

export type UserInventoryV1_0 = z.infer<typeof UserInventorySchemaV1_0>;

/**
 * Example inventory record for documentation
 */
export const EXAMPLE_USER_INVENTORY: UserInventoryV1_0 = {
  schema_version: "1.0",
  inventory_id: "550e8400-e29b-41d4-a716-446655440001",
  strain_id: "trulieve-sunshine-cannabis-white-sunshine-3p5g",
  privacy: {
    storage_location: "database_user_private",
    user_consent: true,
  },
  acquired_month: "2026-01",
  opened: true,
  remaining_estimate: "half",
  storage_type: "glass_jar_airtight",
  storage_conditions: {
    has_humidipack: true,
    location: "dark_cool_place",
  },
  quality_notes: "Still fresh and aromatic. Terpenes holding up well.",
  tags: ["active", "favorite"],
  created_at: "2026-01-15T10:30:00Z",
  updated_at: "2026-01-27T15:00:00Z",
};
