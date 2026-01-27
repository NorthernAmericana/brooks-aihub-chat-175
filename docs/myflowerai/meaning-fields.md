# MyFlowerAI Meaning Fields

## Overview

The `meaning` section provides general informational tags about terpene and cannabinoid profiles in MyFlowerAI strain files. These tags are automatically generated using deterministic thresholds and mapping tables, avoiding definitive medical claims while providing useful contextual information.

## Purpose

- **Informational Context**: Help users understand what characteristics are commonly associated with specific terpenes and cannabinoids
- **Neutral Language**: Use phrases like "commonly associated with" rather than making definitive health claims
- **Deterministic Generation**: Tags are generated algorithmically based on objective thresholds
- **Educational Value**: Provide general knowledge about strain composition without medical advice

## Schema Structure

### `meaning` Section

The `meaning` field is an optional object in the MyFlowerAI v1.1+ schema:

```typescript
{
  "meaning": {
    "aroma_flavor_tags": string[],
    "effect_tags": string[],
    "dominant_terpenes": string[],
    "minor_cannabinoids_present": string[],
    "disclaimers": string[]
  }
}
```

### Field Definitions

#### `aroma_flavor_tags`
- **Type**: `string[]`
- **Description**: Aroma and flavor characteristics commonly associated with the strain's terpene profile
- **Examples**: `["citrus", "earthy", "floral", "spicy", "sweet"]`
- **Source**: Derived from dominant terpenes above threshold levels
- **Sorting**: Alphabetical

#### `effect_tags`
- **Type**: `string[]`
- **Description**: Effects commonly associated with the strain's terpene and cannabinoid profile
- **Examples**: `["relaxing", "uplifting", "calming", "energizing"]`
- **Source**: Derived from dominant terpenes and minor cannabinoids
- **Sorting**: Alphabetical
- **Note**: These are general associations, not medical claims

#### `dominant_terpenes`
- **Type**: `string[]`
- **Description**: Primary terpenes present above threshold levels
- **Examples**: `["limonene", "caryophyllene", "myrcene"]`
- **Sorting**: By concentration (highest to lowest), limited to top 3
- **Threshold**: Each terpene has a specific threshold in the mapping file

#### `minor_cannabinoids_present`
- **Type**: `string[]`
- **Description**: Minor cannabinoids detected above threshold levels
- **Examples**: `["CBG", "CBN", "CBC"]`
- **Sorting**: Alphabetical
- **Note**: Does not include primary cannabinoids (THC, CBD)
- **Threshold**: Typically 0.2% or higher depending on cannabinoid

#### `disclaimers`
- **Type**: `string[]`
- **Description**: General disclaimers about the informational nature of these tags
- **Standard Disclaimers**:
  1. General informational disclaimer
  2. Terpene/cannabinoid profile disclaimer
  3. Individual variation disclaimer
- **Purpose**: Ensure users understand this is not medical advice

## Mapping Logic

### Terpene Mapping

Terpenes are mapped using a reference file at `/data/myflowerai/terpene-cannabinoid-map.json`:

```json
{
  "terpenes": {
    "limonene": {
      "normalized_names": ["limonene", "d-limonene"],
      "aroma_flavor_tags": ["citrus", "lemon", "orange", "fresh"],
      "effect_tags": ["uplifting", "energizing", "mood-enhancing"],
      "threshold_percent": 0.1
    }
  }
}
```

**Threshold Logic**:
- Each terpene has a minimum percentage threshold
- Only terpenes meeting or exceeding their threshold contribute tags
- Top 3 terpenes above threshold are listed as dominant

**Name Normalization**:
- Terpene names are normalized (lowercase, trimmed)
- Multiple variants are matched (e.g., "beta-Myrcene", "b-Myrcene", "Myrcene")
- Partial matching allows flexible recognition

### Cannabinoid Mapping

Minor cannabinoids are identified using threshold-based detection:

```json
{
  "cannabinoids": {
    "cbg": {
      "names": ["cbg", "cbga"],
      "description": "Minor cannabinoid commonly associated with focus",
      "threshold_percent": 0.2
    }
  }
}
```

**Detection Logic**:
- Sum all forms of each cannabinoid (e.g., CBG + CBGA)
- Compare total to threshold
- Include in list if above threshold
- Handle special values like `"<LOQ"` (below limit of quantification) as 0

**Primary vs Minor**:
- THC (including THCA, Delta-9 THC) is considered primary
- CBD (including CBDA) is considered primary
- All others (CBG, CBN, CBC, THCV, CBDV) are minor

## Tag Generation Algorithm

### Step 1: Parse Terpene Profile

1. Iterate through `stats.top_terpenes` array
2. Normalize each terpene name
3. Match against mapping table
4. Check if percentage exceeds threshold
5. Collect aroma/flavor and effect tags
6. Track top 3 terpenes meeting threshold

### Step 2: Identify Minor Cannabinoids

1. Parse `stats.potency_breakdown_percent` object
2. For each minor cannabinoid:
   - Sum all variant forms
   - Convert string values (e.g., `"<LOQ"`) to 0
   - Compare total to threshold
3. Add to list if above threshold

### Step 3: Combine and Deduplicate

1. Combine all aroma/flavor tags (remove duplicates, sort alphabetically)
2. Combine all effect tags (remove duplicates, sort alphabetically)
3. List dominant terpenes (order by concentration)
4. List minor cannabinoids (alphabetical order)
5. Add standard disclaimers

## Implementation

### TypeScript Utility

The tagger utility is located at `/lib/myflowerai/tagger.ts`:

```typescript
import { generateMeaningTags, addMeaningToStrain } from "@/lib/myflowerai/tagger";

// Generate meaning tags
const meaning = generateMeaningTags(
  strain.stats.top_terpenes,
  strain.stats.potency_breakdown_percent
);

// Or add to existing strain object
const strainWithMeaning = addMeaningToStrain(strain);
```

### Key Functions

- **`generateMeaningTags(topTerpenes, potencyBreakdown)`**: Generate meaning tags from raw data
- **`addMeaningToStrain(strain)`**: Add meaning section to existing strain object
- **`normalizeTerpeneName(name)`**: Normalize terpene names for matching
- **`parseNumericValue(value)`**: Handle numeric and string values (e.g., `"<LOQ"`)
- **`findTerpeneMatch(name)`**: Find terpene in mapping table
- **`generateTerpeneBasedTags(terpenes)`**: Extract tags from terpene profile
- **`identifyMinorCannabinoids(potency)`**: Detect minor cannabinoids above threshold

## Examples

### Example 1: Limonene-Dominant Strain

**Input**:
```json
{
  "stats": {
    "top_terpenes": [
      { "name": "d-Limonene", "percent": 0.642 },
      { "name": "beta-Caryophyllene", "percent": 0.558 }
    ],
    "potency_breakdown_percent": {
      "thca": 31.7,
      "cbg": 0.15,
      "cbga": 0.477
    }
  }
}
```

**Output**:
```json
{
  "meaning": {
    "aroma_flavor_tags": ["citrus", "fresh", "lemon", "orange", "peppery", "spicy", "woody"],
    "effect_tags": ["energizing", "mood-enhancing", "relaxing", "uplifting"],
    "dominant_terpenes": ["limonene", "caryophyllene"],
    "minor_cannabinoids_present": ["CBG"],
    "disclaimers": [
      "This information is provided for general informational purposes only...",
      "Terpene and cannabinoid profiles are commonly associated with...",
      "Effects and experiences may vary by individual..."
    ]
  }
}
```

### Example 2: Myrcene-Dominant Indica

**Input**:
```json
{
  "stats": {
    "top_terpenes": [
      { "name": "beta-Myrcene", "percent": 0.85 },
      { "name": "Linalool", "percent": 0.32 }
    ],
    "potency_breakdown_percent": {
      "thca": 22.3,
      "cbn": 0.25
    }
  }
}
```

**Output**:
```json
{
  "meaning": {
    "aroma_flavor_tags": ["clove-like", "earthy", "floral", "herbal", "lavender", "musky", "sweet"],
    "effect_tags": ["calming", "relaxing", "sedating", "stress-relief"],
    "dominant_terpenes": ["myrcene", "linalool"],
    "minor_cannabinoids_present": ["CBN"],
    "disclaimers": [...]
  }
}
```

### Example 3: Low Terpene Strain

**Input**:
```json
{
  "stats": {
    "top_terpenes": [
      { "name": "Limonene", "percent": 0.05 },
      { "name": "Myrcene", "percent": 0.03 }
    ],
    "potency_breakdown_percent": {
      "thca": 18.0
    }
  }
}
```

**Output**:
```json
{
  "meaning": {
    "aroma_flavor_tags": [],
    "effect_tags": [],
    "dominant_terpenes": [],
    "minor_cannabinoids_present": [],
    "disclaimers": [...]
  }
}
```
*Note: No terpenes meet threshold, so no tags are generated*

## Updating Strain Files

### Manual Update

To manually add meaning tags to a strain file:

1. Import the tagger utility
2. Read the existing strain JSON
3. Generate meaning tags
4. Add to strain object
5. Write back to file

### Script Example

```typescript
import fs from "fs";
import { addMeaningToStrain } from "@/lib/myflowerai/tagger";

const strainPath = "data/myflowerai/strains/example-strain.json";
const strain = JSON.parse(fs.readFileSync(strainPath, "utf8"));

const updatedStrain = addMeaningToStrain(strain);

fs.writeFileSync(
  strainPath,
  JSON.stringify(updatedStrain, null, 2)
);
```

## Validation

The meaning section is validated as part of the MyFlowerAI v1.1 schema:

```bash
pnpm validate:myflowerai
```

This validates:
- Correct field types (all are arrays of strings)
- No prohibited medical claims in tags
- Proper schema structure

## Best Practices

### DO:
- ✅ Use neutral, informational language
- ✅ Say "commonly associated with"
- ✅ Include standard disclaimers
- ✅ Use deterministic thresholds
- ✅ Keep tags general and educational
- ✅ Sort arrays consistently (alphabetical or by concentration)

### DON'T:
- ❌ Make definitive medical claims
- ❌ Say "treats", "cures", or "prevents"
- ❌ Recommend for specific medical conditions
- ❌ Use disease names in tags
- ❌ Override thresholds arbitrarily
- ❌ Add subjective opinions

## Future Enhancements

Potential future improvements to the meaning system:

1. **Dynamic Thresholds**: Adjust thresholds based on strain type or total terpene content
2. **Interaction Effects**: Model synergistic effects between terpenes (entourage effect)
3. **User Feedback**: Incorporate user session data to refine associations
4. **Localization**: Provide tags in multiple languages
5. **Expanded Mapping**: Add more terpenes and cannabinoids as research emerges

## References

- Main schema documentation: `/docs/myflowerai/schema.md`
- Mapping reference file: `/data/myflowerai/terpene-cannabinoid-map.json`
- Tagger utility: `/lib/myflowerai/tagger.ts`
- Schema validation: `/lib/validation/myflowerai-schema.ts`

## Disclaimer

All meaning tags are provided for general informational purposes only. They represent common associations reported in cannabis literature and user experiences, not medical advice. Individual experiences may vary. Always consult with a healthcare professional for medical guidance.
