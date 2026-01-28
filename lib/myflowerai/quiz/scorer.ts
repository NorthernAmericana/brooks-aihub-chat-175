/**
 * MyFlowerAI Quiz System - Scorer
 *
 * Handles scoring logic for quiz responses, converting answers
 * into trait vectors and normalizing scores.
 */

import type {
  Quiz,
  QuizQuestion,
  QuizResponse,
  QuizScoringRules,
} from "./types";

/**
 * Calculate raw trait scores from quiz responses
 *
 * @param quiz - Quiz definition
 * @param responses - User's quiz responses
 * @returns Raw trait scores (unnormalized)
 */
export function calculateRawTraitScores(
  quiz: Quiz,
  responses: Record<string, string | number>
): Record<string, number> {
  const traitScores: Record<string, number> = {};

  // Initialize all traits to 0
  for (const trait of quiz.scoring.traits) {
    traitScores[trait] = 0;
  }

  // Process each question response
  for (const question of quiz.questions) {
    const response = responses[question.id];
    if (response === undefined || response === null) {
      continue;
    }

    if (question.type === "multiple-choice") {
      // Find the selected option
      const selectedOption = question.options?.find(
        (opt) => opt.id === response
      );
      if (selectedOption) {
        // Add trait points from this option
        for (const [trait, points] of Object.entries(
          selectedOption.trait_points
        )) {
          traitScores[trait] = (traitScores[trait] || 0) + points;
        }
      }
    } else if (question.type === "slider") {
      // Process slider response
      const value = typeof response === "number" ? response : Number.parseFloat(response as string);
      if (!Number.isNaN(value) && question.slider_config) {
        for (const mapping of question.slider_config.trait_mapping) {
          const points = calculateSliderPoints(
            value,
            question.slider_config.min,
            question.slider_config.max,
            mapping.scale
          );
          traitScores[mapping.trait] =
            (traitScores[mapping.trait] || 0) + points;
        }
      }
    }
  }

  return traitScores;
}

/**
 * Calculate points from a slider value
 *
 * @param value - Slider value
 * @param min - Min slider value
 * @param max - Max slider value
 * @param scale - Scaling function type
 * @returns Points to add to trait
 */
function calculateSliderPoints(
  value: number,
  min: number,
  max: number,
  scale: "linear" | "exponential"
): number {
  // Normalize value to 0-1 range
  const normalized = (value - min) / (max - min);

  if (scale === "linear") {
    // Linear scaling: 0-1 becomes 0-10 points
    return normalized * 10;
  }
  if (scale === "exponential") {
    // Exponential scaling: emphasizes higher values
    return Math.pow(normalized, 2) * 10;
  }

  return normalized * 10;
}

/**
 * Normalize trait scores to 0-1 range
 *
 * @param rawScores - Raw trait scores
 * @param scoringRules - Quiz scoring rules with trait ranges
 * @returns Normalized trait scores (0-1)
 */
export function normalizeTraitScores(
  rawScores: Record<string, number>,
  scoringRules: QuizScoringRules
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const [trait, score] of Object.entries(rawScores)) {
    const range = scoringRules.trait_ranges[trait];
    if (!range) {
      // If no range defined, assume 0-100
      normalized[trait] = Math.max(0, Math.min(1, score / 100));
      continue;
    }

    // Normalize to 0-1 range
    const rangeSize = range.max - range.min;
    const normalizedScore = (score - range.min) / rangeSize;
    normalized[trait] = Math.max(0, Math.min(1, normalizedScore));
  }

  return normalized;
}

/**
 * Find the best matching result profile for trait scores
 *
 * @param normalizedScores - Normalized trait scores (0-1)
 * @param quiz - Quiz definition with profiles
 * @returns Matching profile ID
 */
export function matchResultProfile(
  normalizedScores: Record<string, number>,
  quiz: Quiz
): string {
  // Try to find a profile that matches the score conditions
  for (const mapping of quiz.scoring.profile_mapping) {
    let matches = true;

    for (const [trait, condition] of Object.entries(mapping.conditions)) {
      const score = normalizedScores[trait] || 0;

      // Check min condition
      if (condition.min !== undefined && score < condition.min) {
        matches = false;
        break;
      }

      // Check max condition
      if (condition.max !== undefined && score > condition.max) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return mapping.profile_id;
    }
  }

  // Fallback to first profile if no match
  return quiz.result_profiles[0]?.id || "default";
}

/**
 * Validate quiz responses
 *
 * @param quiz - Quiz definition
 * @param responses - User's quiz responses
 * @returns Array of validation errors (empty if valid)
 */
export function validateQuizResponses(
  quiz: Quiz,
  responses: Record<string, string | number>
): string[] {
  const errors: string[] = [];

  for (const question of quiz.questions) {
    const response = responses[question.id];

    // Check required questions
    if (question.required && (response === undefined || response === null)) {
      errors.push(`Question "${question.id}" is required`);
      continue;
    }

    // Validate multiple-choice responses
    if (question.type === "multiple-choice" && response !== undefined) {
      const validOptionIds = question.options?.map((opt) => opt.id) || [];
      if (!validOptionIds.includes(response as string)) {
        errors.push(`Invalid option selected for question "${question.id}"`);
      }
    }

    // Validate slider responses
    if (question.type === "slider" && response !== undefined) {
      const value = typeof response === "number" ? response : Number.parseFloat(response as string);
      if (Number.isNaN(value)) {
        errors.push(`Invalid slider value for question "${question.id}"`);
      } else if (question.slider_config) {
        if (
          value < question.slider_config.min ||
          value > question.slider_config.max
        ) {
          errors.push(
            `Slider value out of range for question "${question.id}"`
          );
        }
      }
    }
  }

  return errors;
}
