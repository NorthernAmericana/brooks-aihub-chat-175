/**
 * Product IDs for entitlements
 */
export const PRODUCT_IDS = {
  MDD_GAME_BASE: "MDD-GAME_BASE",
  MDD_NOVEL_BASE: "MDD_NOVEL_BASE",
  MDD_SPOILER_PASS: "MDD_SPOILER_PASS",
  FOUNDERS_ACCESS: "FOUNDERS_ACCESS",
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

/**
 * Entitlement rules and logic - placeholders for future implementation
 */
export interface EntitlementRules {
  hasGameAccess: boolean;
  hasNovelAccess: boolean;
  hasSpoilerPass: boolean;
  hasFoundersAccess: boolean;
}

/**
 * Check if user has access to a specific feature based on their entitlements
 * TODO: Implement actual rules based on game owned, novel owned, spoiler pass, progress, and unlock sources
 */
export function checkFeatureAccess(
  rules: EntitlementRules,
  feature: string
): boolean {
  // Placeholder logic - to be implemented
  switch (feature) {
    case "game_base":
      return rules.hasGameAccess;
    case "novel_base":
      return rules.hasNovelAccess;
    case "spoiler_content":
      return rules.hasSpoilerPass;
    case "founders_perks":
      return rules.hasFoundersAccess;
    default:
      return false;
  }
}

/**
 * Founders Access perks
 * TODO: Define actual perks and implement logic
 */
export const FOUNDERS_ACCESS_PERKS = {
  // Placeholder perks - to be defined
  earlyAccess: true,
  exclusiveContent: true,
  prioritySupport: true,
  // Add more perks as they are defined
} as const;

/**
 * Get Founders Access perks for a user
 * TODO: Implement actual perk granting logic
 */
export function getFoundersAccessPerks(): typeof FOUNDERS_ACCESS_PERKS {
  return FOUNDERS_ACCESS_PERKS;
}
