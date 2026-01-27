#!/usr/bin/env tsx
/**
 * Backfill Script: Add Normalized Section to Strain Files
 *
 * Adds the `normalized` section to all existing strain JSON files.
 * This enables cross-dispensary matching and deduplication.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-normalized-section.ts
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { addNormalizedToStrain } from "../lib/myflowerai/normalize";

const STRAINS_DIR = path.join(process.cwd(), "data", "myflowerai", "strains");

interface BackfillResult {
  filename: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Backfill a single strain file
 */
async function backfillFile(filename: string): Promise<BackfillResult> {
  const filepath = path.join(STRAINS_DIR, filename);

  try {
    // Read existing file
    const contents = await readFile(filepath, "utf8");
    const data = JSON.parse(contents);

    // Skip if already has normalized section
    if (data.normalized) {
      return {
        filename,
        success: true,
        skipped: true,
        reason: "Already has normalized section",
      };
    }

    // Skip if template file
    if (filename === "EXAMPLE-TEMPLATE.json") {
      return {
        filename,
        success: true,
        skipped: true,
        reason: "Template file (will be updated separately)",
      };
    }

    // Validate required fields exist
    if (!data.strain?.name || !data.strain?.brand) {
      return {
        filename,
        success: false,
        error: "Missing required strain.name or strain.brand",
      };
    }

    if (!data.product?.category || !data.product?.form) {
      return {
        filename,
        success: false,
        error: "Missing required product.category or product.form",
      };
    }

    // Add normalized section
    const withNormalized = addNormalizedToStrain(data);

    // Write back to file (pretty-printed JSON)
    try {
      await writeFile(filepath, JSON.stringify(withNormalized, null, 2) + "\n", "utf8");
    } catch (writeError) {
      return {
        filename,
        success: false,
        error: `Failed to write file: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
      };
    }

    return {
      filename,
      success: true,
    };
  } catch (error) {
    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main backfill function
 */
async function backfill() {
  console.log("🔄 Backfilling normalized section to strain files...\n");
  console.log(`📂 Directory: ${STRAINS_DIR}\n`);

  // Read all JSON files in directory
  let files: string[];
  try {
    const allFiles = await readdir(STRAINS_DIR);
    files = allFiles.filter((f) => f.endsWith(".json"));
  } catch (error) {
    console.error(`❌ Failed to read directory: ${error}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.warn("⚠️  No JSON files found in directory");
    process.exit(0);
  }

  console.log(`📄 Found ${files.length} JSON files\n`);

  // Backfill each file
  const results: BackfillResult[] = [];
  for (const file of files) {
    const result = await backfillFile(file);
    results.push(result);

    if (result.skipped) {
      console.log(`⏭️  ${result.filename} - ${result.reason}`);
    } else if (result.success) {
      console.log(`✅ ${result.filename} - Added normalized section`);
    } else {
      console.log(`❌ ${result.filename}`);
      if (result.error) {
        console.log(`   → ${result.error}`);
      }
    }
  }

  // Summary
  const successCount = results.filter((r) => r.success && !r.skipped).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Backfill Summary");
  console.log("=".repeat(60));
  console.log(`Total files:     ${files.length}`);
  console.log(`✅ Updated:      ${successCount}`);
  console.log(`⏭️  Skipped:      ${skippedCount}`);
  console.log(`❌ Failed:       ${failedCount}`);
  console.log("=".repeat(60));

  if (failedCount > 0) {
    console.log("\n❌ Some files failed. Please fix the errors above.");
    process.exit(1);
  }

  if (successCount > 0) {
    console.log(`\n✅ Successfully updated ${successCount} strain file(s)!`);
    console.log("\n💡 Next steps:");
    console.log("   1. Review the changes: git diff");
    console.log("   2. Validate the files: pnpm validate:myflowerai");
    console.log("   3. Commit the changes: git add . && git commit");
  } else {
    console.log("\n✅ All files already have normalized sections!");
  }

  process.exit(0);
}

// Run backfill
backfill().catch((error) => {
  console.error("💥 Backfill failed:", error);
  process.exit(1);
});
