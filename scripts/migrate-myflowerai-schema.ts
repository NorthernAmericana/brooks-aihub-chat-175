#!/usr/bin/env tsx
/**
 * Migration Script: MyFlowerAI Schema v1.0 -> v1.1
 *
 * Converts legacy NDJSON strain data to client-facing v1.1 format.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-myflowerai-schema.ts
 *
 * Changes:
 * - Removes: product.location, product.price_*, sources, created_at, updated_at
 * - Adds: schema_version, visibility section
 * - Cleans IDs to remove date suffixes
 * - Outputs individual JSON files per strain
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  MyFlowerAIStrainV1_0,
  MyFlowerAIStrainV1_1,
} from "../lib/validation/myflowerai-schema";

const INPUT_FILE = path.join(
  process.cwd(),
  "data",
  "myflowerai",
  "strains.ndjson"
);
const OUTPUT_DIR = path.join(process.cwd(), "data", "myflowerai", "strains");

// Fields removed from v1.0 for privacy/operational reasons
const EXCLUDED_FIELDS = [
  "product.location",
  "product.price_current_usd",
  "product.price_original_usd",
  "sources",
  "created_at",
  "updated_at",
];

/**
 * Clean ID by removing date suffix
 * Example: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g-2026-01-25"
 *       -> "trulieve-modern-flower-seed-junky-juicy-jane-3p5g"
 */
function cleanId(id: string): string {
  // Remove trailing date pattern (YYYY-MM-DD)
  return id.replace(/-\d{4}-\d{2}-\d{2}$/, "");
}

/**
 * Convert v1.0 strain record to v1.1 format
 */
function migrateToV1_1(v1_0: MyFlowerAIStrainV1_0): MyFlowerAIStrainV1_1 {
  const {
    id,
    app_namespace,
    strain,
    product,
    stats,
    description,
    coa,
    tags,
    your_notes,
    // Explicitly omit these fields from v1.0
    sources: _sources,
    created_at: _created_at,
    updated_at: _updated_at,
  } = v1_0;

  // Remove private fields from product
  const {
    location: _location,
    price_current_usd: _price_current,
    price_original_usd: _price_original,
    ...cleanProduct
  } = product;

  return {
    schema_version: "1.1",
    visibility: {
      client_safe: true,
      excluded_fields: EXCLUDED_FIELDS,
    },
    id: cleanId(id),
    app_namespace,
    strain,
    product: cleanProduct,
    stats,
    description,
    coa,
    tags,
    your_notes,
  };
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("🔄 Starting MyFlowerAI schema migration (v1.0 -> v1.1)...\n");

  // Read input file
  console.log(`📖 Reading input file: ${INPUT_FILE}`);
  const fileContents = await readFile(INPUT_FILE, "utf8");

  // Parse NDJSON
  const lines = fileContents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  console.log(`   Found ${lines.length} strain records\n`);

  // Migrate each record
  const migrated: MyFlowerAIStrainV1_1[] = [];
  const errors: Array<{ line: number; error: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const v1_0 = JSON.parse(lines[i]) as MyFlowerAIStrainV1_0;
      const v1_1 = migrateToV1_1(v1_0);
      migrated.push(v1_1);
    } catch (error) {
      errors.push({
        line: i + 1,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Encountered ${errors.length} errors during migration:`);
    for (const error of errors) {
      console.error(`   Line ${error.line}: ${error.error}`);
    }
    process.exit(1);
  }

  console.log(`✅ Successfully migrated ${migrated.length} records\n`);

  // Write individual JSON files
  console.log(`💾 Writing individual JSON files to: ${OUTPUT_DIR}`);

  let written = 0;
  for (const strain of migrated) {
    const filename = `${strain.id}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    try {
      await writeFile(filepath, JSON.stringify(strain, null, 2), "utf8");
      written++;
      console.log(`   ✓ ${filename}`);
    } catch (error) {
      console.error(`   ✗ Failed to write ${filename}: ${error}`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Migration complete! Wrote ${written} JSON files.`);
  console.log("\n📋 Summary:");
  console.log("   • Input format:  v1.0 (NDJSON)");
  console.log("   • Output format: v1.1 (individual JSON)");
  console.log(`   • Records migrated: ${migrated.length}`);
  console.log(`   • Excluded fields: ${EXCLUDED_FIELDS.length}`);
  console.log(`     - ${EXCLUDED_FIELDS.join("\n     - ")}`);
  console.log("\n🔍 Next steps:");
  console.log(`   1. Review generated files in ${OUTPUT_DIR}`);
  console.log("   2. Run validation: pnpm validate:myflowerai");
  console.log("   3. Update loader code to use v1.1 format");
}

// Run migration
migrate().catch((error) => {
  console.error("💥 Migration failed:", error);
  process.exit(1);
});
