import { z } from "zod";
import { SessionTemplateSchema } from "./session-log-schema";

/**
 * MyFlowerAI Strain Data Schema v1.1
 *
 * Client-facing schema with private/purchase metadata removed.
 * See /docs/myflowerai/schema.md for full documentation.
 */

// Terpene entry
const TerpeneSchema = z.object({
  name: z.string(),
  percent: z.number(),
});

// Potency breakdown (percent)
const PotencyBreakdownPercentSchema = z.object({
  thca: z.union([z.number(), z.string()]),
  delta9_thc: z.union([z.number(), z.string()]),
  cbga: z.union([z.number(), z.string()]).optional(),
  cbg: z.union([z.number(), z.string()]).optional(),
  cbda: z.union([z.number(), z.string()]).optional(),
  cbc: z.union([z.number(), z.string()]).optional(),
  cbd: z.union([z.number(), z.string()]).optional(),
  cbdv: z.union([z.number(), z.string()]).optional(),
  cbn: z.union([z.number(), z.string()]).optional(),
  delta8_thc: z.union([z.number(), z.string()]).optional(),
  thcv: z.union([z.number(), z.string()]).optional(),
});

// Potency breakdown (mg)
const PotencyBreakdownMgSchema = z.object({
  thca_mg: z.number().nullable().optional(),
  delta9_thc_mg: z.number().nullable().optional(),
  cbga_mg: z.number().nullable().optional(),
  cbg_mg: z.number().nullable().optional(),
  cbda_mg: z.number().nullable().optional(),
  cbn_mg: z.number().nullable().optional(),
});

// Strain information
const StrainSchema = z.object({
  name: z.string(),
  type: z.enum(["indica", "sativa", "hybrid"]),
  brand: z.string(),
  lineage: z.array(z.string()),
});

// Product information (v1.1: removed location, prices)
const ProductSchema = z.object({
  dispensary: z.string(),
  category: z.string(),
  form: z.string(),
  size_g: z.number(),
  sku: z.string().nullable().optional(),
  in_stock: z.boolean().nullable().optional(),
});

// Stats (cannabinoids and terpenes)
const StatsSchema = z.object({
  total_thc_percent: z.number(),
  total_cbd_percent: z.number(),
  total_cannabinoids_percent: z.number(),
  total_terpenes_percent: z.number(),
  top_terpenes: z.array(TerpeneSchema),
  potency_breakdown_percent: PotencyBreakdownPercentSchema,
  potency_breakdown_mg: PotencyBreakdownMgSchema,
});

// Description
const DescriptionSchema = z.object({
  dispensary_bio: z.string(),
  vibes_like: z.array(z.string()),
  product_positioning: z.string(),
  brand_info: z.string(),
});

// Certificate of Analysis (COA)
const COASchema = z.object({
  status: z.string(),
  lab: z.string(),
  laboratory_id: z.string(),
  sample_matrix: z.string(),
  admin_route: z.string(),
  product_name_on_coa: z.string(),
  cultivar_on_coa: z.string(),
  completed_at: z.string().optional(),
  received_at: z.string().optional(),
  sample_date: z.string().optional(),
  batch_date: z.string().optional(),
  batch_unit_size_g: z.number(),
  cultivation_facility: z.string(),
  processing_facility: z.string(),
  seed_to_sale_id: z.string().nullable().optional(),
  qa_sample_id: z.string().nullable().optional(),
  batch_size_g: z.number().nullable().optional(),
  units_sampled: z.number().nullable().optional(),
  total_amt_sampled_g: z.number().nullable().optional(),
});

// User notes
const YourNotesSchema = z.object({
  rating_1to10: z.number().nullable().optional(),
  felt_like: z.array(z.string()),
  avoid_if: z.array(z.string()),
  session_notes: z.string(),
});

// Visibility metadata
const VisibilitySchema = z.object({
  client_safe: z.literal(true),
  excluded_fields: z.array(z.string()),
});

/**
 * MyFlowerAI Strain Schema v1.1
 *
 * This is the main client-facing schema with privacy-sensitive fields removed.
 */
export const MyFlowerAIStrainSchemaV1_1 = z.object({
  schema_version: z.literal("1.1"),
  visibility: VisibilitySchema,
  id: z.string(),
  app_namespace: z.literal("myflowerai"),
  strain: StrainSchema,
  product: ProductSchema,
  stats: StatsSchema,
  description: DescriptionSchema,
  coa: COASchema,
  tags: z.array(z.string()),
  your_notes: YourNotesSchema,
  session_template: SessionTemplateSchema.optional(),
});

export type MyFlowerAIStrainV1_1 = z.infer<typeof MyFlowerAIStrainSchemaV1_1>;

/**
 * Legacy v1.0 schema for backward compatibility
 * (includes fields that are removed in v1.1)
 */
const SourceSchema = z.object({
  type: z.string(),
  where: z.string(),
  retrieved_at: z.string(),
  url: z.string().nullable(),
});

const ProductSchemaV1_0 = ProductSchema.extend({
  location: z.string(),
  price_current_usd: z.number().nullable().optional(),
  price_original_usd: z.number().nullable().optional(),
});

export const MyFlowerAIStrainSchemaV1_0 = z.object({
  id: z.string(),
  app_namespace: z.literal("myflowerai"),
  strain: StrainSchema,
  product: ProductSchemaV1_0,
  stats: StatsSchema,
  description: DescriptionSchema,
  coa: COASchema,
  sources: z.array(SourceSchema),
  your_notes: YourNotesSchema,
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MyFlowerAIStrainV1_0 = z.infer<typeof MyFlowerAIStrainSchemaV1_0>;

/**
 * Union type for any supported schema version
 */
export const MyFlowerAIStrainSchema = z.union([
  MyFlowerAIStrainSchemaV1_1,
  MyFlowerAIStrainSchemaV1_0,
]);

export type MyFlowerAIStrain = z.infer<typeof MyFlowerAIStrainSchema>;

/**
 * Type guard to check if a strain is v1.1
 */
export function isStrainV1_1(
  strain: MyFlowerAIStrain
): strain is MyFlowerAIStrainV1_1 {
  return "schema_version" in strain && strain.schema_version === "1.1";
}

/**
 * Type guard to check if a strain is v1.0
 */
export function isStrainV1_0(
  strain: MyFlowerAIStrain
): strain is MyFlowerAIStrainV1_0 {
  return !("schema_version" in strain);
}
