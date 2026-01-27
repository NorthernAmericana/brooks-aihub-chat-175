/**
 * Unit tests for MyFlowerAI Quiz Mapper
 *
 * Tests the trait-to-tag mapping logic, including:
 * - Trait score to tag conversion
 * - Tag match scoring
 * - Threshold-based tag selection
 */

import {
  mapTraitsToTags,
  calculateTagMatchScore,
  normalizeTraitName,
} from "@/lib/myflowerai/quiz/mapper";

// Test: Map traits to tags (high scores)
console.log("Test 1: Map traits to tags with high scores");
const highScores = {
  uplifting: 0.8,
  creative: 0.75,
  relaxing: 0.2,
  social: 0.1,
};
const tags1 = mapTraitsToTags(highScores);
console.assert(tags1.includes("uplifting"), "Should include uplifting");
console.assert(tags1.includes("energizing"), "Should include energizing (from high uplifting)");
console.assert(tags1.includes("creative"), "Should include creative");
console.assert(tags1.includes("focus"), "Should include focus (from high creative)");
console.assert(!tags1.includes("relaxing"), "Should not include relaxing (score too low)");
console.log("✓ Test 1 passed");

// Test: Map traits to tags (medium scores)
console.log("\nTest 2: Map traits to tags with medium scores");
const mediumScores = {
  uplifting: 0.5,
  relaxing: 0.5,
  creative: 0.3,
};
const tags2 = mapTraitsToTags(mediumScores);
console.assert(tags2.includes("uplifting"), "Should include uplifting at medium threshold");
console.assert(tags2.includes("relaxing"), "Should include relaxing at medium threshold");
console.assert(!tags2.includes("energizing"), "Should not include energizing (below 0.7)");
console.assert(!tags2.includes("creative"), "Should not include creative (below 0.4)");
console.log("✓ Test 2 passed");

// Test: Map traits to tags (low scores)
console.log("\nTest 3: Map traits to tags with low scores");
const lowScores = {
  uplifting: 0.1,
  relaxing: 0.1,
  creative: 0.1,
};
const tags3 = mapTraitsToTags(lowScores);
console.assert(tags3.length === 0, `Should have no tags, got ${tags3.length}: ${tags3.join(", ")}`);
console.log("✓ Test 3 passed");

// Test: Calculate tag match score (perfect match)
console.log("\nTest 4: Calculate tag match score (perfect match)");
const recommendedTags = ["uplifting", "creative", "daytime"];
const strainTags = ["uplifting", "creative", "daytime", "extra"];
const matchScore1 = calculateTagMatchScore(recommendedTags, strainTags);
console.assert(matchScore1 === 1.0, `Perfect match should be 1.0, got ${matchScore1}`);
console.log("✓ Test 4 passed");

// Test: Calculate tag match score (partial match)
console.log("\nTest 5: Calculate tag match score (partial match)");
const recommendedTags2 = ["uplifting", "creative", "daytime"];
const strainTags2 = ["uplifting", "creative"];
const matchScore2 = calculateTagMatchScore(recommendedTags2, strainTags2);
const expected2 = 2 / 3; // 2 out of 3 tags match
console.assert(
  Math.abs(matchScore2 - expected2) < 0.01,
  `Partial match should be ${expected2}, got ${matchScore2}`
);
console.log("✓ Test 5 passed");

// Test: Calculate tag match score (no match)
console.log("\nTest 6: Calculate tag match score (no match)");
const recommendedTags3 = ["uplifting", "creative"];
const strainTags3 = ["relaxing", "cozy"];
const matchScore3 = calculateTagMatchScore(recommendedTags3, strainTags3);
console.assert(matchScore3 === 0, `No match should be 0, got ${matchScore3}`);
console.log("✓ Test 6 passed");

// Test: Calculate tag match score with avoid tags
console.log("\nTest 7: Calculate tag match score with avoid tags");
const recommendedTags4 = ["uplifting", "creative"];
const strainTags4 = ["uplifting", "creative", "sedating"]; // sedating is avoid tag
const avoidTags = ["sedating"];
const matchScore4 = calculateTagMatchScore(recommendedTags4, strainTags4, avoidTags);
console.assert(matchScore4 === 0, `Avoid tag should result in 0, got ${matchScore4}`);
console.log("✓ Test 7 passed");

// Test: Calculate tag match score (empty recommended)
console.log("\nTest 8: Calculate tag match score (empty recommended)");
const matchScore5 = calculateTagMatchScore([], ["uplifting", "creative"]);
console.assert(matchScore5 === 0, `Empty recommended should be 0, got ${matchScore5}`);
console.log("✓ Test 8 passed");

// Test: Normalize trait name
console.log("\nTest 9: Normalize trait name");
const normalized1 = normalizeTraitName("Uplifting & Energizing");
console.assert(normalized1 === "uplifting-energizing", `Should normalize to "uplifting-energizing", got "${normalized1}"`);
const normalized2 = normalizeTraitName("  Creative   ");
console.assert(normalized2 === "creative", `Should normalize to "creative", got "${normalized2}"`);
console.log("✓ Test 9 passed");

// Test: Map multiple high traits
console.log("\nTest 10: Map multiple high traits");
const multiHighScores = {
  uplifting: 0.9,
  creative: 0.85,
  social: 0.8,
  active: 0.75,
};
const tags10 = mapTraitsToTags(multiHighScores);
console.assert(tags10.length > 0, "Should have multiple tags");
console.assert(tags10.includes("uplifting"), "Should include uplifting");
console.assert(tags10.includes("creative"), "Should include creative");
console.assert(tags10.includes("social"), "Should include social");
console.log("✓ Test 10 passed");

// Test: Threshold boundary (exactly at threshold)
console.log("\nTest 11: Threshold boundary test");
const boundaryScores = {
  uplifting: 0.7, // Exactly at high threshold
  creative: 0.4,  // Exactly at medium threshold
};
const tags11 = mapTraitsToTags(boundaryScores);
console.assert(tags11.includes("energizing"), "Should include high threshold tags at exactly 0.7");
console.assert(tags11.includes("creative"), "Should include medium threshold tags at exactly 0.4");
console.log("✓ Test 11 passed");

console.log("\n✅ All mapper tests passed!");
