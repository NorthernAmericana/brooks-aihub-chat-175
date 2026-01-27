/**
 * MyFlowerAI Tagger Utility
 *
 * Generates deterministic "meaning" tags for strain files based on
 * terpene profiles and cannabinoid potency breakdown.
 *
 * Uses simple thresholds and mapping tables to provide general
 * informational tags without making medical claims.
 */

import terpeneMap from "@/data/myflowerai/terpene-cannabinoid-map.json";

/**
 * Meaning section structure for strain files
 */
export interface StrainMeaning {
  aroma_flavor_tags: string[];
  effect_tags: string[];
  dominant_terpenes: string[];
  minor_cannabinoids_present: string[];
  disclaimers: string[];
}

/**
 * Terpene data from strain stats
 */
export interface TerpeneEntry {
  name: string;
  percent: number;
}

/**
 * Potency breakdown data from strain stats
 */
export interface PotencyBreakdown {
  thca?: number | string;
  delta9_thc?: number | string;
  cbga?: number | string;
  cbg?: number | string;
  cbda?: number | string;
  cbc?: number | string;
  cbd?: number | string;
  cbdv?: number | string;
  cbn?: number | string;
  delta8_thc?: number | string;
  thcv?: number | string;
}

/**
 * Normalize terpene name for matching against mapping table
 */
function normalizeTerpeneName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Convert string or number to number, handling special cases like "<LOQ"
 */
function parseNumericValue(value: number | string | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  // Handle cases like "<LOQ" or "ND" (not detected)
  if (
    typeof value === "string" &&
    (value.includes("<") || value.toUpperCase() === "ND")
  ) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Find matching terpene in the mapping table
 */
function findTerpeneMatch(terpeneName: string): string | null {
  const normalized = normalizeTerpeneName(terpeneName);

  for (const [key, data] of Object.entries(terpeneMap.terpenes)) {
    const terpeneData = data as {
      normalized_names: string[];
      aroma_flavor_tags: string[];
      effect_tags: string[];
      threshold_percent: number;
    };

    if (
      terpeneData.normalized_names.some(
        (name) => normalized.includes(name) || name.includes(normalized)
      )
    ) {
      return key;
    }
  }

  return null;
}

/**
 * Generate meaning tags from terpene profile
 */
function generateTerpeneBasedTags(topTerpenes: TerpeneEntry[]): {
  aromas: Set<string>;
  effects: Set<string>;
  dominants: string[];
} {
  const aromas = new Set<string>();
  const effects = new Set<string>();
  const dominants: string[] = [];

  for (const terpene of topTerpenes) {
    const matchKey = findTerpeneMatch(terpene.name);
    if (!matchKey) {
      continue;
    }

    const terpeneData =
      terpeneMap.terpenes[matchKey as keyof typeof terpeneMap.terpenes];
    if (!terpeneData) {
      continue;
    }

    // Check if terpene meets threshold
    if (terpene.percent >= terpeneData.threshold_percent) {
      // Add to dominant list (top 3 that meet threshold)
      if (dominants.length < 3) {
        dominants.push(matchKey);
      }

      // Add aroma/flavor tags
      for (const tag of terpeneData.aroma_flavor_tags) {
        aromas.add(tag);
      }

      // Add effect tags
      for (const tag of terpeneData.effect_tags) {
        effects.add(tag);
      }
    }
  }

  return { aromas, effects, dominants };
}

/**
 * Identify minor cannabinoids present above threshold
 */
function identifyMinorCannabinoids(
  potencyBreakdown: PotencyBreakdown
): string[] {
  const minorCannabinoids: string[] = [];

  // Check each minor cannabinoid
  for (const [cannabinoidKey, cannabinoidData] of Object.entries(
    terpeneMap.cannabinoids
  )) {
    // Skip THC (it's the primary, not minor)
    if (cannabinoidKey === "thc") {
      continue;
    }

    const data = cannabinoidData as {
      names: string[];
      description: string;
      threshold_percent: number;
    };

    // Sum up all forms of this cannabinoid
    let totalPercent = 0;
    for (const name of data.names) {
      const value = potencyBreakdown[name as keyof PotencyBreakdown];
      totalPercent += parseNumericValue(value);
    }

    // If above threshold, add to list
    if (totalPercent >= data.threshold_percent) {
      minorCannabinoids.push(cannabinoidKey.toUpperCase());
    }
  }

  return minorCannabinoids.sort();
}

/**
 * Generate complete meaning tags for a strain
 *
 * @param topTerpenes - Array of top terpenes from strain stats
 * @param potencyBreakdown - Cannabinoid breakdown from strain stats
 * @returns Complete meaning section for strain file
 */
export function generateMeaningTags(
  topTerpenes: TerpeneEntry[],
  potencyBreakdown: PotencyBreakdown
): StrainMeaning {
  // Generate terpene-based tags
  const { aromas, effects, dominants } = generateTerpeneBasedTags(topTerpenes);

  // Identify minor cannabinoids
  const minorCannabinoids = identifyMinorCannabinoids(potencyBreakdown);

  // Build disclaimers array (always include general and terpenes disclaimers)
  const disclaimers = [
    terpeneMap.disclaimers.general,
    terpeneMap.disclaimers.terpenes,
    terpeneMap.disclaimers.effects,
  ];

  return {
    aroma_flavor_tags: Array.from(aromas).sort(),
    effect_tags: Array.from(effects).sort(),
    dominant_terpenes: dominants,
    minor_cannabinoids_present: minorCannabinoids,
    disclaimers,
  };
}

/**
 * Add meaning section to an existing strain object
 *
 * @param strain - Strain object with stats.top_terpenes and stats.potency_breakdown_percent
 * @returns Strain object with meaning section added
 */
export function addMeaningToStrain<
  T extends {
    stats: {
      top_terpenes: TerpeneEntry[];
      potency_breakdown_percent: PotencyBreakdown;
    };
  },
>(strain: T): T & { meaning: StrainMeaning } {
  const meaning = generateMeaningTags(
    strain.stats.top_terpenes,
    strain.stats.potency_breakdown_percent
  );

  return {
    ...strain,
    meaning,
  };
}
