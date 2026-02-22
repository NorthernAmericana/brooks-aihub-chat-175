/**
 * MyFlowerAI Quiz System - Type Definitions
 *
 * Type definitions for the personality quiz system that helps users
 * discover strains that match their preferences and usage patterns.
 *
 * IMPORTANT: This system does NOT store personally identifying data.
 * Quiz responses can be stored privately per user if needed, but never
 * in public strain JSON files.
 */

/**
 * Quiz answer option for multiple-choice questions
 */
export interface QuizAnswerOption {
  id: string;
  text: string;
  // Points contributed to each trait (e.g., { "uplifting": 2, "relaxing": -1 })
  trait_points: Record<string, number>;
}

/**
 * Slider-scale answer configuration
 */
export interface QuizSliderConfig {
  min: number;
  max: number;
  step: number;
  labels: {
    min: string;
    max: string;
  };
  // How slider value maps to trait points
  trait_mapping: {
    trait: string;
    // Function: value => points (e.g., linear, exponential)
    scale: "linear" | "exponential";
  }[];
}

/**
 * Quiz question
 */
export interface QuizQuestion {
  id: string;
  text: string;
  description?: string;
  type: "multiple-choice" | "slider";
  // For multiple-choice questions
  options?: QuizAnswerOption[];
  // For slider questions
  slider_config?: QuizSliderConfig;
  required: boolean;
}

/**
 * Quiz scoring rules
 */
export interface QuizScoringRules {
  // Traits being measured (e.g., "uplifting", "relaxing", "creative", "social", "night")
  traits: string[];
  // Min/max possible points for each trait
  trait_ranges: Record<string, { min: number; max: number }>;
  // How to map trait scores to result profiles
  profile_mapping: {
    // Profile thresholds (e.g., if uplifting > 5 && creative > 3)
    conditions: Record<string, { min?: number; max?: number }>;
    profile_id: string;
  }[];
}

/**
 * Result profile (persona card)
 */
export interface QuizResultProfile {
  id: string;
  name: string; // e.g., "The Creative Explorer"
  vibe_text: string; // Description of this persona
  // Trait radar data (normalized 0-1)
  trait_scores: Record<string, number>;
  // Recommended strain tags
  recommended_tags: string[];
  // Avoid tags (for negative matches)
  avoid_tags?: string[];
}

/**
 * Complete quiz definition
 */
export interface Quiz {
  id: string;
  version: string; // e.g., "1.0"
  title: string;
  description: string;
  questions: QuizQuestion[];
  scoring: QuizScoringRules;
  result_profiles: QuizResultProfile[];
  disclaimers: string[];
}

/**
 * User's quiz responses (private, never stored in public files)
 */
export interface QuizResponse {
  quiz_id: string;
  quiz_version: string;
  responses: Record<string, string | number>; // question_id => answer
  completed_at: string; // ISO timestamp
}

/**
 * Quiz result for a user
 */
export interface QuizResult {
  quiz_id: string;
  quiz_version: string;
  // Raw trait scores
  trait_scores: Record<string, number>;
  // Normalized trait scores (0-1)
  normalized_trait_scores: Record<string, number>;
  // Matched profile
  profile: QuizResultProfile;
  // Suggested strains from database (optional)
  suggested_strains?: {
    id: string;
    name: string;
    brand: string;
    type?: string;
    match_score: number; // 0-1 based on tag overlap
    matching_tags: string[];
  }[];
}

/**
 * Trait-to-tag mapping configuration
 */
export interface TraitTagMapping {
  // Trait name
  trait: string;
  // Tags associated with this trait at different threshold levels
  mappings: {
    threshold: number; // Normalized score threshold (0-1)
    tags: string[];
  }[];
}
