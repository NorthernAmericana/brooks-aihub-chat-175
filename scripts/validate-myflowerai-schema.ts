#!/usr/bin/env tsx
/**
 * Validation Script: MyFlowerAI Schema v1.1
 *
 * Validates all strain JSON files against the v1.1 schema.
 *
 * Usage:
 *   pnpm tsx scripts/validate-myflowerai-schema.ts
 *   pnpm validate:myflowerai
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { MyFlowerAIStrainSchemaV1_1 } from "../lib/validation/myflowerai-schema";

const STRAINS_DIR = path.join(process.cwd(), "data", "myflowerai", "strains");

interface ValidationResult {
  filename: string;
  valid: boolean;
  errors?: string[];
}

/**
 * Validate a single strain file
 */
async function validateFile(filename: string): Promise<ValidationResult> {
  const filepath = path.join(STRAINS_DIR, filename);

  try {
    const contents = await readFile(filepath, "utf8");
    const data = JSON.parse(contents);

    // Check for privacy violations before proceeding with schema validation
    const privacyErrors: string[] = [];
    
    // Explicitly check for session/session_log arrays (MUST NOT exist in public files)
    if ("sessions" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'sessions' array found. User session logs must NEVER be stored in public strain files. Store in private per-user storage instead."
      );
    }
    if ("session_logs" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'session_logs' array found. User session logs must NEVER be stored in public strain files. Store in private per-user storage instead."
      );
    }
    if ("user_sessions" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'user_sessions' array found. User session logs must NEVER be stored in public strain files. Store in private per-user storage instead."
      );
    }
    
    // Check for inventory-related privacy violations
    if ("inventory" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'inventory' array found. User inventory records must NEVER be stored in public strain files. Store in private per-user storage instead."
      );
    }
    if ("user_inventory" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'user_inventory' array found. User inventory records must NEVER be stored in public strain files. Store in private per-user storage instead."
      );
    }
    if ("opened_date" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'opened_date' field found. Exact dates must NOT be stored in public strain files."
      );
    }
    if ("remaining_g" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'remaining_g' field found. Exact amounts must NOT be stored in public strain files."
      );
    }
    if ("purchase_date" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'purchase_date' field found. Purchase dates must NOT be stored in public strain files."
      );
    }
    if ("purchase_location" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'purchase_location' field found. Purchase locations must NOT be stored in public strain files."
      );
    }
    if ("user_stash_amount" in data) {
      privacyErrors.push(
        "PRIVACY VIOLATION: 'user_stash_amount' field found. User stash amounts must NOT be stored in public strain files."
      );
    }

    if (privacyErrors.length > 0) {
      return {
        filename,
        valid: false,
        errors: privacyErrors,
      };
    }

    // Validate against v1.1 schema
    MyFlowerAIStrainSchemaV1_1.parse(data);

    return {
      filename,
      valid: true,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        filename,
        valid: false,
        errors: error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
      };
    }

    return {
      filename,
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Main validation function
 */
async function validate() {
  console.log("🔍 Validating MyFlowerAI strain files (schema v1.1)...\n");
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
    console.log("\n💡 Hint: Run migration script first:");
    console.log("   pnpm tsx scripts/migrate-myflowerai-schema.ts");
    process.exit(0);
  }

  console.log(`📄 Found ${files.length} JSON files\n`);

  // Validate each file
  const results: ValidationResult[] = [];
  for (const file of files) {
    const result = await validateFile(file);
    results.push(result);

    if (result.valid) {
      console.log(`✅ ${result.filename}`);
    } else {
      console.log(`❌ ${result.filename}`);
      if (result.errors) {
        for (const error of result.errors) {
          console.log(`   → ${error}`);
        }
      }
    }
  }

  // Summary
  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Validation Summary");
  console.log("=".repeat(60));
  console.log(`Total files:    ${files.length}`);
  console.log(`✅ Valid:       ${validCount}`);
  console.log(`❌ Invalid:     ${invalidCount}`);
  console.log("=".repeat(60));

  if (invalidCount > 0) {
    console.log("\n❌ Validation failed. Please fix the errors above.");
    process.exit(1);
  }

  console.log("\n✅ All files are valid!");
  process.exit(0);
}

// Run validation
validate().catch((error) => {
  console.error("💥 Validation failed:", error);
  process.exit(1);
});
