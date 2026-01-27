/**
 * MyFlowerAI Quiz System - Engine
 *
 * Main quiz engine that orchestrates quiz loading, scoring, and result generation.
 * Converts user responses into personalized strain recommendations.
 *
 * PRIVACY: This system does NOT store personally identifying data.
 * Quiz responses are ephemeral or stored privately per user.
 */

import type { Quiz, QuizResponse, QuizResult, QuizResultProfile } from "./types";
import {
  calculateRawTraitScores,
  matchResultProfile,
  normalizeTraitScores,
  validateQuizResponses,
} from "./scorer";
import { calculateTagMatchScore, mapTraitsToTags } from "./mapper";

/**
 * Load quiz from JSON file
 *
 * @param quizId - Quiz ID (e.g., "strain-personality-v1")
 * @returns Quiz definition
 */
export async function loadQuiz(quizId: string): Promise<Quiz> {
  // In production, this would load from the data directory
  // For now, we'll use dynamic import
  const quizModule = await import(
    `@/data/myflowerai/quizzes/${quizId}.json`
  );
  return quizModule.default as Quiz;
}

/**
 * Process quiz responses and generate results
 *
 * @param quiz - Quiz definition
 * @param responses - User's quiz responses
 * @returns Quiz result with profile and recommendations
 * @throws Error if validation fails
 */
export function processQuizResponses(
  quiz: Quiz,
  responses: Record<string, string | number>
): Omit<QuizResult, "suggested_strains"> {
  // Validate responses
  const validationErrors = validateQuizResponses(quiz, responses);
  if (validationErrors.length > 0) {
    throw new Error(`Quiz validation failed: ${validationErrors.join(", ")}`);
  }

  // Calculate raw trait scores
  const rawTraitScores = calculateRawTraitScores(quiz, responses);

  // Normalize scores to 0-1 range
  const normalizedTraitScores = normalizeTraitScores(
    rawTraitScores,
    quiz.scoring
  );

  // Find matching profile
  const profileId = matchResultProfile(normalizedTraitScores, quiz);
  const profile = quiz.result_profiles.find((p) => p.id === profileId);

  if (!profile) {
    throw new Error(`Profile ${profileId} not found in quiz`);
  }

  // Update profile trait scores with actual user scores
  const profileWithScores: QuizResultProfile = {
    ...profile,
    trait_scores: normalizedTraitScores,
  };

  return {
    quiz_id: quiz.id,
    quiz_version: quiz.version,
    trait_scores: rawTraitScores,
    normalized_trait_scores: normalizedTraitScores,
    profile: profileWithScores,
  };
}

/**
 * Generate strain recommendations based on quiz result
 *
 * @param result - Quiz result
 * @param strainDatabase - Array of strain objects with tags
 * @returns Quiz result with suggested strains
 */
export function generateStrainRecommendations<
  T extends { id: string; strain: { name: string; brand: string }; tags: string[] }
>(
  result: Omit<QuizResult, "suggested_strains">,
  strainDatabase: T[]
): QuizResult {
  // Get recommended tags from profile
  const recommendedTags = result.profile.recommended_tags;
  const avoidTags = result.profile.avoid_tags || [];

  // Score each strain
  const scoredStrains = strainDatabase.map((strain) => {
    const matchScore = calculateTagMatchScore(
      recommendedTags,
      strain.tags,
      avoidTags
    );

    return {
      id: strain.id,
      name: strain.strain.name,
      brand: strain.strain.brand,
      match_score: matchScore,
      matching_tags: strain.tags.filter((tag) => recommendedTags.includes(tag)),
    };
  });

  // Sort by match score and take top 10
  const topStrains = scoredStrains
    .filter((s) => s.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);

  return {
    ...result,
    suggested_strains: topStrains,
  };
}

/**
 * Get all available quizzes
 *
 * @returns Array of quiz metadata (id, title, description)
 */
export async function getAvailableQuizzes(): Promise<
  Array<{ id: string; title: string; description: string; version: string }>
> {
  // In production, this would scan the quizzes directory
  // For now, return hardcoded list
  return [
    {
      id: "strain-personality-v1",
      title: "What Strain Are You?",
      description:
        "Discover your cannabis personality and get personalized strain recommendations",
      version: "1.0",
    },
  ];
}

/**
 * Create a quiz response object
 *
 * @param quizId - Quiz ID
 * @param quizVersion - Quiz version
 * @param responses - User responses
 * @returns QuizResponse object
 */
export function createQuizResponse(
  quizId: string,
  quizVersion: string,
  responses: Record<string, string | number>
): QuizResponse {
  return {
    quiz_id: quizId,
    quiz_version: quizVersion,
    responses,
    completed_at: new Date().toISOString(),
  };
}
