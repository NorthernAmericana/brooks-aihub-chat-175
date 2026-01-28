/**
 * MyFlowerAI Strain Meaning Utility
 * 
 * Ensures strain meaning tags exist or derives them deterministically
 * from strain stats and terpene profiles.
 */

import type { StrainMeaning } from "../tagger";

/**
 * Strain data structure with stats
 */
export interface StrainStats {
  thc_percent?: number;
  cbd_percent?: number;
  top_terpenes?: Array<{ name: string; percent: number }>;
}

/**
 * Full strain data with type and stats
 */
export interface StrainData {
  strain: {
    name: string;
    type: string; // "sativa", "indica", "hybrid"
  };
  stats?: StrainStats;
  meaning?: StrainMeaning;
}

/**
 * Terpene to effect/aroma mapping
 * Maps terpene names to likely effects and aromas
 */
const TERPENE_MAPPINGS: Record<
  string,
  { effects: string[]; aromas: string[] }
> = {
  myrcene: {
    effects: ["relaxing", "sedating", "calming"],
    aromas: ["earthy", "herbal"],
  },
  limonene: {
    effects: ["uplifting", "mood-enhancing", "energizing"],
    aromas: ["citrus", "lemon"],
  },
  caryophyllene: {
    effects: ["stress-relief", "calming"],
    aromas: ["spicy", "pepper"],
  },
  pinene: {
    effects: ["focus", "mental-clarity", "energizing"],
    aromas: ["pine", "herbal"],
  },
  linalool: {
    effects: ["relaxing", "calming", "sedating"],
    aromas: ["floral", "lavender"],
  },
  humulene: {
    effects: ["relaxing", "calming"],
    aromas: ["earthy", "woody"],
  },
  terpinolene: {
    effects: ["uplifting", "energizing"],
    aromas: ["floral", "herbal", "citrus"],
  },
  ocimene: {
    effects: ["uplifting", "energizing"],
    aromas: ["sweet", "herbal"],
  },
};

/**
 * Derive meaning tags from strain stats and terpenes
 * 
 * @param strainData - Strain data with stats
 * @returns Derived strain meaning tags
 */
export function deriveStrainMeaning(strainData: StrainData): StrainMeaning {
  // If meaning already exists, return it
  if (strainData.meaning) {
    return strainData.meaning;
  }

  const effectTags = new Set<string>();
  const aromaFlavorTags = new Set<string>();
  const dominantTerpenes: string[] = [];

  // Derive from strain type
  const strainType = strainData.strain.type.toLowerCase();
  if (strainType === "sativa") {
    effectTags.add("uplifting");
    effectTags.add("energizing");
    effectTags.add("daytime");
  } else if (strainType === "indica") {
    effectTags.add("relaxing");
    effectTags.add("calming");
    effectTags.add("night");
  } else if (strainType === "hybrid") {
    effectTags.add("balanced");
  }

  // Derive from terpenes
  if (strainData.stats?.top_terpenes) {
    for (const terpene of strainData.stats.top_terpenes.slice(0, 3)) {
      const terpeneName = terpene.name.toLowerCase();
      const mapping = TERPENE_MAPPINGS[terpeneName];

      // Add to dominant terpenes list
      dominantTerpenes.push(terpene.name);

      if (mapping) {
        // Add effects
        for (const effect of mapping.effects) {
          effectTags.add(effect);
        }

        // Add aromas
        for (const aroma of mapping.aromas) {
          aromaFlavorTags.add(aroma);
        }
      }
    }
  }

  // Derive from THC/CBD ratio
  if (strainData.stats) {
    const thc = strainData.stats.thc_percent || 0;
    const cbd = strainData.stats.cbd_percent || 0;

    if (thc > 20) {
      effectTags.add("potent");
    }

    if (cbd > 5) {
      effectTags.add("calming");
      effectTags.add("balanced");
    }
  }

  return {
    effect_tags: Array.from(effectTags).sort(),
    aroma_flavor_tags: Array.from(aromaFlavorTags).sort(),
    dominant_terpenes: dominantTerpenes,
    minor_cannabinoids_present: [],
    disclaimers: [
      "Effects are general informational tags derived from terpene profiles and cannabinoid ratios.",
      "Individual experiences may vary.",
    ],
  };
}

/**
 * Ensure strain has meaning tags
 * Returns existing meaning or derives new ones
 * 
 * @param strainData - Strain data
 * @returns Strain data with meaning tags
 */
export function ensureStrainMeaning(
  strainData: StrainData
): StrainData & { meaning: StrainMeaning } {
  return {
    ...strainData,
    meaning: strainData.meaning || deriveStrainMeaning(strainData),
  };
}

/**
 * Get recommended tags from strain meaning
 * Combines effect and aroma tags for matching
 * 
 * @param meaning - Strain meaning tags
 * @returns Combined array of tags
 */
export function getRecommendedTagsFromMeaning(
  meaning: StrainMeaning
): string[] {
  return [...meaning.effect_tags, ...meaning.aroma_flavor_tags];
}
