/**
 * Unit tests for MyFlowerAI Quiz Scorer
 *
 * Tests the scoring logic for quiz responses, including:
 * - Raw trait score calculation
 * - Score normalization
 * - Profile matching
 * - Response validation
 */

import {
  calculateRawTraitScores,
  normalizeTraitScores,
  matchResultProfile,
  validateQuizResponses,
} from "@/lib/myflowerai/quiz/scorer";
import type { Quiz } from "@/lib/myflowerai/quiz/types";

// Mock quiz for testing
const mockQuiz: Quiz = {
  id: "test-quiz",
  version: "1.0",
  title: "Test Quiz",
  description: "Test quiz for unit tests",
  questions: [
    {
      id: "q1",
      text: "Question 1",
      type: "multiple-choice",
      required: true,
      options: [
        {
          id: "opt1",
          text: "Option 1",
          trait_points: { creative: 5, social: 2 },
        },
        {
          id: "opt2",
          text: "Option 2",
          trait_points: { relaxing: 3, cozy: 4 },
        },
      ],
    },
    {
      id: "q2",
      text: "Question 2",
      type: "slider",
      required: true,
      slider_config: {
        min: 1,
        max: 10,
        step: 1,
        labels: { min: "Low", max: "High" },
        trait_mapping: [
          { trait: "uplifting", scale: "linear" },
        ],
      },
    },
  ],
  scoring: {
    traits: ["creative", "social", "relaxing", "cozy", "uplifting"],
    trait_ranges: {
      creative: { min: 0, max: 10 },
      social: { min: 0, max: 10 },
      relaxing: { min: 0, max: 10 },
      cozy: { min: 0, max: 10 },
      uplifting: { min: 0, max: 10 },
    },
    profile_mapping: [
      {
        conditions: { creative: { min: 0.4 }, social: { min: 0.1 } },
        profile_id: "creative_social",
      },
      {
        conditions: { relaxing: { min: 0.3 }, cozy: { min: 0.3 } },
        profile_id: "relaxed_cozy",
      },
    ],
  },
  result_profiles: [
    {
      id: "creative_social",
      name: "Creative & Social",
      vibe_text: "You're creative and social!",
      trait_scores: {},
      recommended_tags: ["creative", "social"],
    },
    {
      id: "relaxed_cozy",
      name: "Relaxed & Cozy",
      vibe_text: "You're relaxed and cozy!",
      trait_scores: {},
      recommended_tags: ["relaxing", "cozy"],
    },
  ],
  disclaimers: ["Test disclaimer"],
};

// Test: Calculate raw trait scores
console.log("Test 1: Calculate raw trait scores from multiple-choice");
const responses1 = { q1: "opt1", q2: 5 };
const rawScores1 = calculateRawTraitScores(mockQuiz, responses1);
console.assert(rawScores1.creative === 5, "Creative score should be 5");
console.assert(rawScores1.social === 2, "Social score should be 2");
console.assert(rawScores1.uplifting === 5, "Uplifting score should be 5 (from slider)");
console.log("✓ Test 1 passed");

// Test: Calculate raw trait scores with different option
console.log("\nTest 2: Calculate raw trait scores with option 2");
const responses2 = { q1: "opt2", q2: 8 };
const rawScores2 = calculateRawTraitScores(mockQuiz, responses2);
console.assert(rawScores2.relaxing === 3, "Relaxing score should be 3");
console.assert(rawScores2.cozy === 4, "Cozy score should be 4");
console.assert(rawScores2.uplifting === 8, "Uplifting score should be 8");
console.log("✓ Test 2 passed");

// Test: Normalize trait scores
console.log("\nTest 3: Normalize trait scores");
const normalized = normalizeTraitScores(rawScores1, mockQuiz.scoring);
console.assert(normalized.creative === 0.5, `Creative normalized should be 0.5, got ${normalized.creative}`);
console.assert(normalized.social === 0.2, `Social normalized should be 0.2, got ${normalized.social}`);
console.assert(normalized.uplifting === 0.5, `Uplifting normalized should be 0.5, got ${normalized.uplifting}`);
console.log("✓ Test 3 passed");

// Test: Normalize with edge cases
console.log("\nTest 4: Normalize with edge cases (out of range)");
const edgeScores = { creative: 15, social: -5 };
const normalizedEdge = normalizeTraitScores(edgeScores, mockQuiz.scoring);
console.assert(normalizedEdge.creative === 1, "Over-max should normalize to 1");
console.assert(normalizedEdge.social === 0, "Under-min should normalize to 0");
console.log("✓ Test 4 passed");

// Test: Match result profile (creative_social)
console.log("\nTest 5: Match result profile (creative_social)");
const normalizedForCreative = { creative: 0.5, social: 0.2, relaxing: 0, cozy: 0, uplifting: 0.5 };
const profileId1 = matchResultProfile(normalizedForCreative, mockQuiz);
console.assert(profileId1 === "creative_social", `Should match creative_social, got ${profileId1}`);
console.log("✓ Test 5 passed");

// Test: Match result profile (relaxed_cozy)
console.log("\nTest 6: Match result profile (relaxed_cozy)");
const normalizedForRelaxed = { creative: 0, social: 0, relaxing: 0.4, cozy: 0.5, uplifting: 0 };
const profileId2 = matchResultProfile(normalizedForRelaxed, mockQuiz);
console.assert(profileId2 === "relaxed_cozy", `Should match relaxed_cozy, got ${profileId2}`);
console.log("✓ Test 6 passed");

// Test: Validate responses (valid)
console.log("\nTest 7: Validate responses (valid)");
const validResponses = { q1: "opt1", q2: 5 };
const errors1 = validateQuizResponses(mockQuiz, validResponses);
console.assert(errors1.length === 0, `Should have no errors, got ${errors1.length}`);
console.log("✓ Test 7 passed");

// Test: Validate responses (missing required)
console.log("\nTest 8: Validate responses (missing required)");
const missingResponses = { q1: "opt1" }; // q2 is required but missing
const errors2 = validateQuizResponses(mockQuiz, missingResponses);
console.assert(errors2.length > 0, "Should have validation errors");
console.assert(errors2[0].includes("q2"), "Error should mention q2");
console.log("✓ Test 8 passed");

// Test: Validate responses (invalid option)
console.log("\nTest 9: Validate responses (invalid option)");
const invalidResponses = { q1: "invalid_option", q2: 5 };
const errors3 = validateQuizResponses(mockQuiz, invalidResponses);
console.assert(errors3.length > 0, "Should have validation errors");
console.assert(errors3[0].includes("Invalid option"), "Error should mention invalid option");
console.log("✓ Test 9 passed");

// Test: Validate responses (slider out of range)
console.log("\nTest 10: Validate responses (slider out of range)");
const outOfRangeResponses = { q1: "opt1", q2: 15 }; // max is 10
const errors4 = validateQuizResponses(mockQuiz, outOfRangeResponses);
console.assert(errors4.length > 0, "Should have validation errors");
console.assert(errors4[0].includes("out of range"), "Error should mention out of range");
console.log("✓ Test 10 passed");

console.log("\n✅ All scorer tests passed!");
