/**
 * Update MyFlowerAI strain files with meaning tags
 *
 * This script reads all strain JSON files, generates meaning tags
 * using the tagger utility, and updates the files.
 */

import fs from "node:fs";
import path from "node:path";
import { addMeaningToStrain } from "../lib/myflowerai/tagger";

const STRAINS_DIR = path.join(process.cwd(), "data/myflowerai/strains");

function updateStrainFiles() {
  console.log("🌿 Updating MyFlowerAI strain files with meaning tags...\n");

  // Read all JSON files in strains directory
  const files = fs
    .readdirSync(STRAINS_DIR)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file !== "EXAMPLE-TEMPLATE.json"); // Skip template initially

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(STRAINS_DIR, file);

    try {
      console.log(`Processing: ${file}`);

      // Read strain file
      const content = fs.readFileSync(filePath, "utf8");
      const strain = JSON.parse(content);

      // Check if strain already has meaning tags
      if (strain.meaning) {
        console.log("  ⚠️  Already has meaning tags, regenerating...");
      }

      // Generate and add meaning tags
      const updatedStrain = addMeaningToStrain(strain);

      // Write back to file with proper formatting
      fs.writeFileSync(filePath, `${JSON.stringify(updatedStrain, null, 2)}\n`);

      console.log("  ✅ Updated successfully");
      console.log(
        `     - Aroma/flavor tags: ${updatedStrain.meaning.aroma_flavor_tags.length}`
      );
      console.log(
        `     - Effect tags: ${updatedStrain.meaning.effect_tags.length}`
      );
      console.log(
        `     - Dominant terpenes: ${updatedStrain.meaning.dominant_terpenes.length}`
      );
      console.log(
        `     - Minor cannabinoids: ${updatedStrain.meaning.minor_cannabinoids_present.length}\n`
      );

      successCount++;
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error);
      errorCount++;
    }
  }

  // Now update the template
  const templateFile = "EXAMPLE-TEMPLATE.json";
  const templatePath = path.join(STRAINS_DIR, templateFile);

  try {
    console.log(`Processing: ${templateFile}`);
    const content = fs.readFileSync(templatePath, "utf8");
    const strain = JSON.parse(content);
    const updatedStrain = addMeaningToStrain(strain);
    fs.writeFileSync(
      templatePath,
      `${JSON.stringify(updatedStrain, null, 2)}\n`
    );
    console.log("  ✅ Updated template successfully\n");
    successCount++;
  } catch (error) {
    console.error("  ❌ Error processing template:", error);
    errorCount++;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✨ Complete!");
  console.log(`   Success: ${successCount} files`);
  console.log(`   Errors: ${errorCount} files`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

updateStrainFiles();
