# MyFlowerAI Strain Normalization

## Overview

The normalization system provides deterministic, stable rules for matching cannabis products across different dispensaries. By normalizing strain names, brands, categories, and form factors, we can identify the same product sold at different locations and enable cross-dispensary comparisons.

## Purpose

**Cross-Dispensary Matching**: Match the same strain and product across different dispensaries
- Example: "White Sunshine" from Sunshine Cannabis at Trulieve should match the same strain at other dispensaries

**Deduplication**: Use generated keys to identify duplicate entries
- Prevent the same strain from appearing multiple times in the database

**Search & Discovery**: Enable users to search for products using various naming conventions
- Users can search "OG Kush" or "O.G. Kush" and find all matches

**Analytics**: Aggregate data across dispensaries for insights
- Compare pricing, availability, and potency across locations

## Schema Structure

The `normalized` section is added to each strain file:

```json
{
  "normalized": {
    "canonical_strain_name": "white sunshine",
    "canonical_brand": "sunshine cannabis",
    "canonical_product_category": "flower",
    "canonical_form_factor": "3.5g_whole_flower",
    "ids": {
      "strain_key": "a1b2c3d4e5f6g7h8",
      "product_key": "z9y8x7w6v5u4t3s2"
    }
  }
}
```

### Field Definitions

#### `canonical_strain_name`
- **Type**: `string`
- **Purpose**: Normalized strain name for matching
- **Rules**:
  - Convert to lowercase
  - Remove all punctuation and special characters
  - Collapse multiple spaces to single space
  - Trim leading/trailing whitespace

**Examples**:
```
"White Sunshine" → "white sunshine"
"Juicy Jane's #1" → "juicy janes 1"
"O.G. Kush" → "og kush"
"Gelato #33" → "gelato 33"
```

#### `canonical_brand`
- **Type**: `string`
- **Purpose**: Normalized brand name for matching
- **Rules**: Same as strain name normalization

**Examples**:
```
"Sunshine Cannabis" → "sunshine cannabis"
"Modern Flower Co." → "modern flower co"
"710 Labs" → "710 labs"
```

#### `canonical_product_category`
- **Type**: `string`
- **Purpose**: Standardized product category
- **Supported Values**:
  - `flower` - Whole flower, buds
  - `vape` - Vape cartridges, vape pens
  - `edible` - Edibles, gummies, chocolates
  - `concentrate` - Concentrates, extracts, wax, shatter
  - `preroll` - Pre-rolled joints
  - `topical` - Topical products, lotions, balms
  - `tincture` - Tinctures, oils
  - `capsule` - Capsules, pills
  - `other` - Other product types

**Mapping Examples**:
```
"flower" → "flower"
"Flower" → "flower"
"flowers" → "flower"
"bud" → "flower"
"vape" → "vape"
"cartridge" → "vape"
"edibles" → "edible"
"pre-rolls" → "preroll"
```

#### `canonical_form_factor`
- **Type**: `string`
- **Purpose**: Standardized product size and type
- **Format**: `{size}{unit}_{type}`
- **Common Values**:
  - `3.5g_whole_flower` - Eighth ounce of flower
  - `7g_whole_flower` - Quarter ounce of flower
  - `14g_whole_flower` - Half ounce of flower
  - `28g_whole_flower` - Ounce of flower
  - `1g_preroll` - 1 gram pre-roll
  - `0.5g_preroll` - Half gram pre-roll
  - `0.5g_vape_cartridge` - Half gram vape cartridge
  - `1g_vape_cartridge` - 1 gram vape cartridge
  - `100mg_edible` - 100mg edible
  - `1g_concentrate` - 1 gram concentrate

**Extraction Rules**:
1. Extract size from the form string (e.g., "3.5g", "100mg")
2. Identify product type from keywords and category
3. Format as `{size}{unit}_{type}`

**Examples**:
```
"3.5g Whole Flower" + category "flower" → "3.5g_whole_flower"
"1g Pre-Roll" + category "preroll" → "1g_preroll"
"0.5g Cartridge" + category "vape" → "0.5g_vape_cartridge"
"100mg Gummy" + category "edible" → "100mg_edible"
"Flower Pouch - 3.5g" + category "flower" → "3.5g_whole_flower"
```

#### `ids.strain_key`
- **Type**: `string`
- **Purpose**: Deterministic hash for strain deduplication
- **Generation**: SHA-256 hash of `{canonical_strain_name}|{canonical_brand}`, first 16 characters
- **Use Case**: Match the same strain across dispensaries, regardless of product size

**Example**:
```
Input: "White Sunshine" + "Sunshine Cannabis"
Normalized: "white sunshine|sunshine cannabis"
Hash: SHA-256 → first 16 chars
Output: "a5cf1b087d554dc2" (actual hash from real data)
```

#### `ids.product_key`
- **Type**: `string`
- **Purpose**: Deterministic hash for product deduplication
- **Generation**: SHA-256 hash of `{canonical_strain_name}|{canonical_brand}|{canonical_product_category}|{canonical_form_factor}`, first 16 characters
- **Use Case**: Match the exact same product (strain + size) across dispensaries

**Example**:
```
Input: "White Sunshine" + "Sunshine Cannabis" + "flower" + "3.5g Whole Flower"
Normalized: "white sunshine|sunshine cannabis|flower|3.5g_whole_flower"
Hash: SHA-256 → first 16 chars
Output: "7960325b6402e35e" (actual hash from real data)
```

## Usage

### Adding Normalization to a Strain File

```typescript
import { addNormalizedToStrain } from "@/lib/myflowerai/normalize";

const strainData = {
  strain: {
    name: "White Sunshine",
    brand: "Sunshine Cannabis",
    // ... other strain fields
  },
  product: {
    category: "flower",
    form: "3.5g Whole Flower",
    // ... other product fields
  },
  // ... other fields
};

const withNormalized = addNormalizedToStrain(strainData);
// Now includes: normalized: { canonical_strain_name, canonical_brand, ... }
```

### Generating Just the Normalized Section

```typescript
import { generateNormalizedSection } from "@/lib/myflowerai/normalize";

const normalized = generateNormalizedSection({
  name: "White Sunshine",
  brand: "Sunshine Cannabis",
  category: "flower",
  form: "3.5g Whole Flower",
});

console.log(normalized);
// {
//   canonical_strain_name: "white sunshine",
//   canonical_brand: "sunshine cannabis",
//   canonical_product_category: "flower",
//   canonical_form_factor: "3.5g_whole_flower",
//   ids: {
//     strain_key: "98bcf39df3220fe1",
//     product_key: "5caa5d6a01419629"
//   }
// }
```

### Using Individual Normalization Functions

```typescript
import {
  normalizeStrainName,
  normalizeBrand,
  normalizeProductCategory,
  normalizeFormFactor,
  generateStrainKey,
  generateProductKey,
} from "@/lib/myflowerai/normalize";

// Normalize individual fields
const strainName = normalizeStrainName("O.G. Kush"); // "og kush"
const brand = normalizeBrand("710 Labs"); // "710 labs"
const category = normalizeProductCategory("flower"); // "flower"
const formFactor = normalizeFormFactor("3.5g Whole Flower", "flower"); // "3.5g_whole_flower"

// Generate keys
const strainKey = generateStrainKey("O.G. Kush", "710 Labs");
const productKey = generateProductKey("O.G. Kush", "710 Labs", "flower", "3.5g Whole Flower");
```

## Matching Examples

### Same Strain, Different Dispensaries

**Dispensary A**:
```json
{
  "strain": { "name": "White Sunshine", "brand": "Sunshine Cannabis" },
  "product": { "dispensary": "Trulieve", "category": "flower", "form": "3.5g Whole Flower" }
}
```

**Dispensary B**:
```json
{
  "strain": { "name": "White Sunshine", "brand": "Sunshine Cannabis" },
  "product": { "dispensary": "Curaleaf", "category": "flower", "form": "3.5g Flower" }
}
```

**Both generate the same**:
- `strain_key`: Same (matches on strain + brand)
- `product_key`: Same (matches on strain + brand + category + form factor)

### Same Strain, Different Sizes

**3.5g Product**:
```json
{
  "strain": { "name": "White Sunshine", "brand": "Sunshine Cannabis" },
  "product": { "category": "flower", "form": "3.5g Whole Flower" }
}
```

**7g Product**:
```json
{
  "strain": { "name": "White Sunshine", "brand": "Sunshine Cannabis" },
  "product": { "category": "flower", "form": "7g Whole Flower" }
}
```

**Keys**:
- `strain_key`: Same (both are the same strain)
- `product_key`: Different (different form factors)

### Name Variations

**Variation 1**:
```
"O.G. Kush" → canonical: "og kush" → strain_key: "abc123..."
```

**Variation 2**:
```
"OG Kush" → canonical: "og kush" → strain_key: "abc123..."
```

**Result**: Both variations produce the same `strain_key`, enabling matching.

## Implementation Guidelines

### Deterministic Rules

All normalization functions use deterministic rules:
- Same input always produces same output
- No random elements or timestamps
- Hash-based keys are reproducible

### Backward Compatibility

The `normalized` section is additive:
- Existing fields remain unchanged
- Normalization can be added to existing strain files
- Files without normalization continue to work

### Privacy & Safety

The `normalized` section contains only derived data:
- No personal information
- No purchase history
- No user preferences
- Safe for public exposure

### Performance Considerations

- Normalization is fast (no external API calls)
- Keys are short (16 characters) for efficient storage
- Suitable for client-side or server-side processing

## Backfilling Existing Data

To add normalization to existing strain files, use the backfill script:

```bash
pnpm tsx scripts/backfill-normalized-section.ts
```

This script:
1. Reads all existing strain JSON files
2. Generates the `normalized` section for each
3. Updates files in place
4. Preserves all existing data

## Validation

The normalization section is validated as part of the schema validation:

```bash
pnpm validate:myflowerai
```

This ensures:
- All required fields are present
- Field values are well-formed
- Keys are the correct length

## Use Cases

### 1. Cross-Dispensary Price Comparison

```typescript
// Find all products with the same strain_key
const products = await findByStrainKey("a1b2c3d4e5f6g7h8");

// Compare prices across dispensaries
products.forEach(product => {
  console.log(`${product.product.dispensary}: $${product.product.price}`);
});
```

### 2. Product Deduplication

```typescript
// Check if product already exists
const existingProduct = await findByProductKey("z9y8x7w6v5u4t3s2");

if (existingProduct) {
  console.log("Product already in database");
} else {
  console.log("New product, add to database");
}
```

### 3. Flexible Search

```typescript
// User searches "og kush"
const searchTerm = normalizeStrainName("og kush");

// Matches:
// - "O.G. Kush"
// - "OG Kush"
// - "O.G.Kush"
// - etc.
```

### 4. Analytics & Reporting

```typescript
// Group products by form factor
const productsByFormFactor = groupBy(
  products,
  p => p.normalized.canonical_form_factor
);

console.log("3.5g products:", productsByFormFactor["3.5g_whole_flower"].length);
console.log("7g products:", productsByFormFactor["7g_whole_flower"].length);
```

## Future Enhancements

Potential future improvements:
- Machine learning-based name matching for fuzzy matching
- Integration with external strain databases (e.g., Leafly, Weedmaps)
- Regional variations in naming conventions
- Support for international products (grams vs. ounces)
- Compound product types (e.g., infused pre-rolls)

## References

- [Schema Documentation](/docs/myflowerai/schema.md)
- [Validation Script](/scripts/validate-myflowerai-schema.ts)
- [Normalization Utility](/lib/myflowerai/normalize.ts)
