/**
 * MyFlowerAI Normalization Utility
 *
 * Provides deterministic normalization functions for cross-dispensary matching.
 * All functions use stable, repeatable rules to ensure consistent results.
 *
 * The normalized section enables:
 * - Matching the same strain across different dispensaries
 * - Grouping products by category and form factor
 * - Deduplication using generated keys
 */

import crypto from "node:crypto";

/**
 * Normalized section structure for strain files
 */
export interface NormalizedSection {
  canonical_strain_name: string;
  canonical_brand: string;
  canonical_product_category: string;
  canonical_form_factor: string;
  ids: {
    strain_key: string;
    product_key: string;
  };
}

/**
 * Normalize a strain name for cross-dispensary matching
 *
 * Rules:
 * - Convert to lowercase
 * - Remove all punctuation and special characters
 * - Collapse multiple spaces to single space
 * - Trim leading/trailing whitespace
 *
 * @param name - Original strain name
 * @returns Normalized strain name
 *
 * @example
 * normalizeStrainName("White Sunshine") // "white sunshine"
 * normalizeStrainName("Juicy Jane's #1") // "juicy janes 1"
 * normalizeStrainName("O.G. Kush") // "og kush"
 */
export function normalizeStrainName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Normalize a brand name for cross-dispensary matching
 *
 * Rules:
 * - Convert to lowercase
 * - Remove all punctuation and special characters
 * - Collapse multiple spaces to single space
 * - Trim leading/trailing whitespace
 *
 * @param brand - Original brand name
 * @returns Normalized brand name
 *
 * @example
 * normalizeBrand("Sunshine Cannabis") // "sunshine cannabis"
 * normalizeBrand("Modern Flower Co.") // "modern flower co"
 * normalizeBrand("710 Labs") // "710 labs"
 */
export function normalizeBrand(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Normalize a product category to canonical form
 *
 * Supported categories:
 * - flower
 * - vape
 * - edible
 * - concentrate
 * - preroll
 * - topical
 * - tincture
 * - capsule
 * - other
 *
 * @param category - Original product category
 * @returns Canonical category name
 *
 * @example
 * normalizeProductCategory("flower") // "flower"
 * normalizeProductCategory("Flower") // "flower"
 * normalizeProductCategory("VAPE") // "vape"
 * normalizeProductCategory("edibles") // "edible"
 */
export function normalizeProductCategory(category: string): string {
  const normalized = category.toLowerCase().trim();

  // Map variations to canonical forms
  const categoryMap: Record<string, string> = {
    flower: "flower",
    flowers: "flower",
    bud: "flower",
    buds: "flower",
    vape: "vape",
    vapes: "vape",
    cartridge: "vape",
    cartridges: "vape",
    cart: "vape",
    carts: "vape",
    edible: "edible",
    edibles: "edible",
    concentrate: "concentrate",
    concentrates: "concentrate",
    extract: "concentrate",
    extracts: "concentrate",
    preroll: "preroll",
    prerolls: "preroll",
    "pre-roll": "preroll",
    "pre-rolls": "preroll",
    joint: "preroll",
    joints: "preroll",
    topical: "topical",
    topicals: "topical",
    tincture: "tincture",
    tinctures: "tincture",
    capsule: "capsule",
    capsules: "capsule",
    pill: "capsule",
    pills: "capsule",
  };

  return categoryMap[normalized] || "other";
}

/**
 * Normalize a product form factor to canonical form
 *
 * Rules:
 * - Extract size in grams
 * - Identify product type (whole_flower, preroll, etc.)
 * - Format as: {size}g_{type}
 *
 * Common form factors:
 * - 3.5g_whole_flower
 * - 1g_preroll
 * - 0.5g_vape_cartridge
 * - 100mg_edible
 * - 1g_concentrate
 *
 * @param form - Original product form description
 * @param category - Product category (helps with inference)
 * @returns Canonical form factor
 *
 * @example
 * normalizeFormFactor("3.5g Whole Flower", "flower") // "3.5g_whole_flower"
 * normalizeFormFactor("1g Pre-Roll", "preroll") // "1g_preroll"
 * normalizeFormFactor("0.5g Cartridge", "vape") // "0.5g_vape_cartridge"
 */
export function normalizeFormFactor(
  form: string,
  category: string
): string {
  const normalized = form.toLowerCase().trim();

  // Extract size (grams or milligrams)
  let size = "";
  let unit = "g";

  // Try to find gram measurement
  const gramMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?/);
  if (gramMatch) {
    size = gramMatch[1];
    unit = "g";
  } else {
    // Try to find milligram measurement (for edibles)
    const mgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mg/);
    if (mgMatch) {
      size = mgMatch[1];
      unit = "mg";
    }
  }

  // If no size found, return generic form factor
  if (!size) {
    return `unknown_${normalizeProductCategory(category)}`;
  }

  // Determine product type based on form description and category
  let type = "";

  if (
    normalized.includes("whole") ||
    normalized.includes("flower") ||
    normalized.includes("bud")
  ) {
    type = "whole_flower";
  } else if (
    normalized.includes("preroll") ||
    normalized.includes("pre-roll") ||
    normalized.includes("joint")
  ) {
    type = "preroll";
  } else if (
    normalized.includes("cartridge") ||
    normalized.includes("cart") ||
    normalized.includes("vape")
  ) {
    type = "vape_cartridge";
  } else if (normalized.includes("edible") || unit === "mg") {
    type = "edible";
  } else if (
    normalized.includes("concentrate") ||
    normalized.includes("extract") ||
    normalized.includes("wax") ||
    normalized.includes("shatter") ||
    normalized.includes("live resin")
  ) {
    type = "concentrate";
  } else {
    // Fall back to category-based type
    const canonicalCategory = normalizeProductCategory(category);
    if (canonicalCategory === "flower") {
      type = "whole_flower";
    } else if (canonicalCategory === "vape") {
      type = "vape_cartridge";
    } else {
      type = canonicalCategory;
    }
  }

  return `${size}${unit}_${type}`;
}

/**
 * Generate a deterministic strain key for deduplication
 *
 * The strain key is based on:
 * - Normalized strain name
 * - Normalized brand
 *
 * This allows matching the same strain across dispensaries.
 *
 * @param strainName - Original strain name
 * @param brand - Original brand name
 * @returns Deterministic strain key (SHA-256 hash, first 16 chars)
 *
 * @example
 * generateStrainKey("White Sunshine", "Sunshine Cannabis")
 * // "a1b2c3d4e5f6g7h8"
 */
export function generateStrainKey(strainName: string, brand: string): string {
  const normalized = `${normalizeStrainName(strainName)}|${normalizeBrand(brand)}`;
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return hash.substring(0, 16);
}

/**
 * Generate a deterministic product key for deduplication
 *
 * The product key is based on:
 * - Normalized strain name
 * - Normalized brand
 * - Canonical product category
 * - Canonical form factor
 *
 * This allows matching the exact same product across dispensaries.
 *
 * @param strainName - Original strain name
 * @param brand - Original brand name
 * @param category - Product category
 * @param formFactor - Product form factor
 * @returns Deterministic product key (SHA-256 hash, first 16 chars)
 *
 * @example
 * generateProductKey("White Sunshine", "Sunshine Cannabis", "flower", "3.5g Whole Flower")
 * // "z9y8x7w6v5u4t3s2"
 */
export function generateProductKey(
  strainName: string,
  brand: string,
  category: string,
  formFactor: string
): string {
  const canonicalCategory = normalizeProductCategory(category);
  const canonicalFormFactor = normalizeFormFactor(formFactor, category);
  const normalized = `${normalizeStrainName(strainName)}|${normalizeBrand(brand)}|${canonicalCategory}|${canonicalFormFactor}`;
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return hash.substring(0, 16);
}

/**
 * Generate complete normalized section for a strain
 *
 * This is the main function to use when adding normalization to strain files.
 *
 * @param strain - Strain data with name, brand, category, and form
 * @returns Complete normalized section
 *
 * @example
 * const normalized = generateNormalizedSection({
 *   name: "White Sunshine",
 *   brand: "Sunshine Cannabis",
 *   category: "flower",
 *   form: "3.5g Whole Flower"
 * });
 * // {
 * //   canonical_strain_name: "white sunshine",
 * //   canonical_brand: "sunshine cannabis",
 * //   canonical_product_category: "flower",
 * //   canonical_form_factor: "3.5g_whole_flower",
 * //   ids: {
 * //     strain_key: "a1b2c3d4e5f6g7h8",
 * //     product_key: "z9y8x7w6v5u4t3s2"
 * //   }
 * // }
 */
export function generateNormalizedSection(strain: {
  name: string;
  brand: string;
  category: string;
  form: string;
}): NormalizedSection {
  const canonicalStrainName = normalizeStrainName(strain.name);
  const canonicalBrand = normalizeBrand(strain.brand);
  const canonicalProductCategory = normalizeProductCategory(strain.category);
  const canonicalFormFactor = normalizeFormFactor(strain.form, strain.category);

  return {
    canonical_strain_name: canonicalStrainName,
    canonical_brand: canonicalBrand,
    canonical_product_category: canonicalProductCategory,
    canonical_form_factor: canonicalFormFactor,
    ids: {
      strain_key: generateStrainKey(strain.name, strain.brand),
      product_key: generateProductKey(
        strain.name,
        strain.brand,
        strain.category,
        strain.form
      ),
    },
  };
}

/**
 * Add normalized section to an existing strain object
 *
 * @param strain - Strain object with strain.name, strain.brand, product.category, and product.form
 * @returns Strain object with normalized section added
 *
 * @example
 * const strainData = {
 *   strain: { name: "White Sunshine", brand: "Sunshine Cannabis" },
 *   product: { category: "flower", form: "3.5g Whole Flower" }
 * };
 * const withNormalized = addNormalizedToStrain(strainData);
 * // { ...strainData, normalized: { ... } }
 */
export function addNormalizedToStrain<
  T extends {
    strain: {
      name: string;
      brand: string;
    };
    product: {
      category: string;
      form: string;
    };
  },
>(strain: T): T & { normalized: NormalizedSection } {
  const normalized = generateNormalizedSection({
    name: strain.strain.name,
    brand: strain.strain.brand,
    category: strain.product.category,
    form: strain.product.form,
  });

  return {
    ...strain,
    normalized,
  };
}
