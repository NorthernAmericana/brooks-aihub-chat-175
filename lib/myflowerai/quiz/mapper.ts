/**
 * MyFlowerAI Quiz System - Trait to Tag Mapper
 *
 * Deterministically converts trait vectors to strain tags.
 * This provides user-friendly strain recommendations based on
 * quiz personality results.
 *
 * IMPORTANT: These are informational tags, NOT medical advice.
 */

import type { TraitTagMapping } from "./types";

/**
 * Default trait-to-tag mappings
 *
 * Maps normalized trait scores (0-1) to strain effect/use-case tags
 */
export const DEFAULT_TRAIT_TAG_MAPPINGS: TraitTagMapping[] = [
  {
    trait: "uplifting",
    mappings: [
      { threshold: 0.7, tags: ["energizing", "uplifting", "mood-enhancing", "daytime"] },
      { threshold: 0.4, tags: ["uplifting", "mood-enhancing"] },
    ],
  },
  {
    trait: "relaxing",
    mappings: [
      { threshold: 0.7, tags: ["relaxing", "calming", "sedating", "night"] },
      { threshold: 0.4, tags: ["relaxing", "calming"] },
    ],
  },
  {
    trait: "creative",
    mappings: [
      { threshold: 0.7, tags: ["creative", "focus", "artistic", "mental-clarity"] },
      { threshold: 0.4, tags: ["creative", "focus"] },
    ],
  },
  {
    trait: "social",
    mappings: [
      { threshold: 0.7, tags: ["social", "uplifting", "conversational", "party"] },
      { threshold: 0.4, tags: ["social", "uplifting"] },
    ],
  },
  {
    trait: "cozy",
    mappings: [
      { threshold: 0.7, tags: ["cozy", "relaxing", "comfortable", "indoor", "night"] },
      { threshold: 0.4, tags: ["cozy", "relaxing"] },
    ],
  },
  {
    trait: "active",
    mappings: [
      { threshold: 0.7, tags: ["energizing", "active", "outdoor", "daytime", "productive"] },
      { threshold: 0.4, tags: ["active", "energizing"] },
    ],
  },
  {
    trait: "focused",
    mappings: [
      { threshold: 0.7, tags: ["focus", "mental-clarity", "productive", "daytime"] },
      { threshold: 0.4, tags: ["focus", "mental-clarity"] },
    ],
  },
  {
    trait: "adventurous",
    mappings: [
      { threshold: 0.7, tags: ["adventurous", "outdoor", "active", "daytime"] },
      { threshold: 0.4, tags: ["adventurous", "outdoor"] },
    ],
  },
];

/**
 * Map normalized trait scores to strain tags
 *
 * @param normalizedTraitScores - Trait scores normalized to 0-1 range
 * @param mappings - Optional custom trait-to-tag mappings
 * @returns Array of recommended strain tags
 */
export function mapTraitsToTags(
  normalizedTraitScores: Record<string, number>,
  mappings: TraitTagMapping[] = DEFAULT_TRAIT_TAG_MAPPINGS
): string[] {
  const tags = new Set<string>();

  for (const mapping of mappings) {
    const traitScore = normalizedTraitScores[mapping.trait] || 0;

    // Find the highest threshold that the score meets
    const sortedMappings = [...mapping.mappings].sort(
      (a, b) => b.threshold - a.threshold
    );

    for (const thresholdMapping of sortedMappings) {
      if (traitScore >= thresholdMapping.threshold) {
        for (const tag of thresholdMapping.tags) {
          tags.add(tag);
        }
        break; // Only apply the first matching threshold
      }
    }
  }

  return Array.from(tags).sort();
}

/**
 * Calculate match score between quiz result tags and strain tags
 *
 * @param recommendedTags - Tags from quiz result
 * @param strainTags - Tags from strain data
 * @param avoidTags - Tags to avoid (optional)
 * @returns Match score from 0-1
 */
export function calculateTagMatchScore(
  recommendedTags: string[],
  strainTags: string[],
  avoidTags: string[] = []
): number {
  if (recommendedTags.length === 0) {
    return 0;
  }

  // Check for avoid tags first
  const hasAvoidTag = avoidTags.some((tag) => strainTags.includes(tag));
  if (hasAvoidTag) {
    return 0; // Zero out if strain has any avoid tags
  }

  // Calculate overlap
  const strainTagSet = new Set(strainTags);
  const matchingTags = recommendedTags.filter((tag) => strainTagSet.has(tag));

  // Score is ratio of matching tags
  const overlapScore = matchingTags.length / recommendedTags.length;

  return overlapScore;
}

/**
 * Normalize a trait name for matching
 *
 * @param trait - Trait name to normalize
 * @returns Normalized trait name
 */
export function normalizeTraitName(trait: string): string {
  return trait.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}
