# MyFlowerAI Strain Data Schema

## Schema Version 1.1 (Current)

### Overview

The MyFlowerAI strain data schema v1.1 is a **client-facing** format designed to provide cannabis strain information that is safe for public consumption. This version removes all private metadata, purchase information, and exact location/timestamp data that should not be exposed to end users.

### Design Principles

1. **Client-Safe Data Only**: No personally identifying information, exact store addresses, or precise timestamps
2. **Analysis-Focused**: Retains all data useful for strain comparison and user decision-making
3. **Privacy-First**: Sensitive operational data belongs in separate internal-only schemas
4. **Versioned**: Explicit `schema_version` field enables graceful evolution

### Schema Structure

#### Top-Level Fields

```typescript
{
  schema_version: "1.1",
  visibility: {
    client_safe: boolean,
    excluded_fields: string[]
  },
  id: string,
  app_namespace: string,
  strain: { ... },
  product: { ... },
  stats: { ... },
  description: { ... },
  coa: { ... },
  tags: string[],
  your_notes: { ... }
}
```

#### Field Definitions

##### `schema_version` (required)
- Type: `string`
- Value: `"1.1"`
- Purpose: Enables version detection and backward compatibility

##### `visibility` (required)
- Type: `object`
- Fields:
  - `client_safe`: `true` (always true for v1.1 files)
  - `excluded_fields`: Array of field names removed from v1.0 for privacy
- Purpose: Documents what data must never be stored in client-facing files

##### `id` (required)
- Type: `string`
- Example: `"trulieve-modern-flower-seed-junky-juicy-jane-3p5g"`
- Purpose: Unique identifier (timestamps removed from v1.0)

##### `app_namespace` (required)
- Type: `string`
- Value: `"myflowerai"`
- Purpose: Identifies data source application

##### `strain` (required)
- Type: `object`
- Fields:
  - `name`: Strain name (e.g., "Juicy Jane")
  - `type`: Strain type ("indica" | "sativa" | "hybrid")
  - `brand`: Brand or breeder name
  - `lineage`: Array of parent strain names

##### `product` (required)
- Type: `object`
- Fields retained from v1.0:
  - `dispensary`: Dispensary name (not exact location)
  - `category`: Product category (e.g., "flower")
  - `form`: Product form (e.g., "3.5g Whole Flower")
  - `size_g`: Size in grams
  - `sku`: Product SKU
  - `in_stock`: Boolean availability status
  - `confidence_score_0_1`: Label reliability confidence score (0 to 1)
  - `dose_ci_low`: Lower bound for dose confidence interval
  - `dose_ci_high`: Upper bound for dose confidence interval
  - `dose_ci_low_missing`: Explicit missingness flag for lower bound
  - `dose_ci_high_missing`: Explicit missingness flag for upper bound
- **Removed from v1.0**:
  - `location`: Exact store address (privacy concern)
  - `price_current_usd`: Current price (purchase metadata)
  - `price_original_usd`: Original price (purchase metadata)

##### `stats` (required)
- Type: `object`
- Complete cannabinoid and terpene analysis
- Fields:
  - `total_thc_percent`: Total THC percentage
  - `total_cbd_percent`: Total CBD percentage
  - `total_cannabinoids_percent`: Total cannabinoids
  - `total_terpenes_percent`: Total terpenes
  - `top_terpenes`: Array of terpene objects with `name` and `percent`
  - `potency_breakdown_percent`: Detailed cannabinoid breakdown
  - `potency_breakdown_mg`: Cannabinoid content in milligrams

##### `description` (required)
- Type: `object`
- Marketing and experiential descriptions
- Fields:
  - `dispensary_bio`: Dispensary's strain description
  - `vibes_like`: Array of use-case descriptions
  - `product_positioning`: Product marketing copy
  - `brand_info`: Brand background information

##### `coa` (required)
- Type: `object`
- Certificate of Analysis summary (operational dates made less precise)
- Fields retained:
  - `status`: Test result status (e.g., "passed")
  - `lab`: Laboratory name
  - `provenance_lab`: Explicit COA provenance lab value
  - `provenance_method`: Test method used by the lab (e.g., HPLC)
  - `provenance_batch`: Batch identifier used for testing
  - `provenance_test_date`: Test date for the COA sample
  - `laboratory_id`: Lab report ID
  - `sample_matrix`: Sample type
  - `admin_route`: Administration route
  - `product_name_on_coa`: Product name on COA
  - `cultivar_on_coa`: Cultivar name on COA
  - `batch_unit_size_g`: Unit size
  - `cultivation_facility`: Cultivation location
  - `processing_facility`: Processing location
  - `seed_to_sale_id`: Tracking ID
  - `qa_sample_id`: QA sample ID
  - `batch_size_g`: Batch size
  - `units_sampled`: Number of units sampled
  - `total_amt_sampled_g`: Total amount sampled
- **Modified from v1.0**:
  - Date fields (`completed_at`, `received_at`, `sample_date`, `batch_date`) retained but not required to be exact timestamps

##### `tags` (required)
- Type: `string[]`
- User-friendly tags for search and filtering
- Examples: `["hybrid", "fruit-forward", "balanced", "social", "daytime"]`

##### `your_notes` (required)
- Type: `object`
- User-editable personal notes section
- Fields:
  - `rating_1to10`: User rating (nullable)
  - `felt_like`: Array of effect descriptions
  - `avoid_if`: Array of warnings
  - `session_notes`: Freeform notes

##### `session_template` (optional, added in v1.1.1)
- Type: `object`
- Public guidance for AI agents on session logging
- **NOTE**: This is PUBLIC data providing guidance, NOT private session logs
- Fields:
  - `suggested_methods`: Array of recommended consumption methods (e.g., `["joint", "vaporizer_dry_herb"]`)
  - `suggested_dose_guidance_text`: Natural language dosing advice based on strain potency
  - `recommended_questions`: Array of questions for AI agent to ask when logging sessions
- Purpose: Helps AI agents ask consistent, strain-appropriate questions
- Privacy: User session logs (answers to these questions) are stored in PRIVATE storage, never in public strain files
- See `/docs/myflowerai/session-logging.md` for complete session logging documentation

##### `freshness_guidance` (optional, added in v1.2)
- Type: `object`
- Public guidance on cannabis freshness and storage best practices
- **NOTE**: This is PUBLIC data providing general guidance, NOT user-specific inventory
- Fields:
  - `best_storage`: Natural language description of optimal storage conditions (temperature, humidity, container type, light exposure)
  - `typical_shelf_life_days`: Expected shelf life in days under optimal storage conditions (unopened)
  - `notes`: Additional context about freshness degradation, terpene preservation, or usage recommendations
  - `do_not_store_in_public`: Array of field names that should NEVER be added to public strain files (documentation/reminder)
- Purpose: Helps AI agents provide consistent, strain-appropriate storage and freshness advice
- Privacy: User inventory records (opened dates, remaining amounts, purchase dates) are stored in PRIVATE storage, never in public strain files
- See `/docs/myflowerai/inventory-management.md` for complete inventory and freshness documentation

##### `packaging` (optional, added in v1.2)
- Type: `object`
- Public recommendations for cannabis storage containers and accessories
- **NOTE**: This is PUBLIC data providing general recommendations
- Fields:
  - `container_type_suggestions`: Array of recommended container types for optimal storage (e.g., `["Glass jar with airtight seal", "CVault container"]`)
  - `humidipack_recommended`: Boolean indicating whether a humidity control pack (like Boveda) is recommended
- Purpose: Helps AI agents recommend appropriate storage solutions
- See `/docs/myflowerai/inventory-management.md` for complete documentation

##### `use_cases` (optional, added in v1.4)
- Type: `object`
- Public generic use case tags for strain guidance (NON-MEDICAL)
- **NOTE**: This is PUBLIC data with generic tags, NOT personalized recommendations
- Fields:
  - `best_for_tags`: Array of generic, non-medical use case tags (e.g., `["creative", "social", "daytime", "relaxation", "focus", "outdoor_activities"]`)
  - `avoid_if_tags`: Array of generic caution tags (non-medical) (e.g., `["too_strong_for_newbies", "intense_effects", "may_cause_drowsiness"]`)
- Purpose: Provides generic guidance on common use patterns and considerations
- **CRITICAL**: These are NOT personalized medical recommendations. Personal user preferences go in PRIVATE `personal_fit` table
- Example:
  ```json
  "use_cases": {
    "best_for_tags": ["creative", "social", "daytime", "relaxation"],
    "avoid_if_tags": ["too_strong_for_newbies", "intense_effects"]
  }
  ```
- See `/docs/myflowerai/personal-fit.md` for personal fit tracking and the distinction between public use cases and private personal fit data

#### Removed Fields (from v1.0)

The following fields are **removed** in v1.1 as they contain private/purchase metadata:

1. **`product.location`**: Exact store address (replaced with dispensary name only)
2. **`product.price_current_usd`**: Current price (purchase metadata)
3. **`product.price_original_usd`**: Original price (purchase metadata)
4. **`sources`**: Array containing `retrieved_at` timestamps (operational metadata)
5. **`created_at`**: Record creation timestamp (operational metadata)
6. **`updated_at`**: Record update timestamp (operational metadata)

#### Prohibited Fields (MUST NOT be added)

The following fields are **explicitly prohibited** in public strain files to maintain privacy:

1. **`sessions`**: User session logs array - PRIVACY VIOLATION
2. **`session_logs`**: User session logs array - PRIVACY VIOLATION  
3. **`user_sessions`**: User session logs array - PRIVACY VIOLATION
4. **`inventory`**: User inventory records array - PRIVACY VIOLATION
5. **`user_inventory`**: User inventory records array - PRIVACY VIOLATION
6. **`opened_date`**: Date when product was opened - PRIVACY VIOLATION
7. **`remaining_g`**: Exact grams remaining - PRIVACY VIOLATION
8. **`purchase_date`**: Date of purchase - PRIVACY VIOLATION
9. **`purchase_location`**: Store address or GPS coordinates - PRIVACY VIOLATION
10. **`user_stash_amount`**: User's stash amount - PRIVACY VIOLATION
11. **`personal_fit`**: Per-user fit data - PRIVACY VIOLATION (belongs in private personal_fit table)
12. **`rating_1to10`**: User-specific rating - PRIVACY VIOLATION (belongs in private personal_fit table)
13. **`repeat_probability`**: User-specific reuse likelihood - PRIVACY VIOLATION (belongs in private personal_fit table)
14. Any field containing personally identifying information
15. Any field containing user consumption history
16. Any field containing exact purchase or inventory amounts
17. Any field containing personalized medical advice or recommendations

**Note**: 
- User session data must be stored in private per-user storage (Supabase, local encrypted, or private namespace). See `/docs/myflowerai/session-logging.md` for proper session logging implementation.
- User inventory data must be stored in private per-user storage. See `/docs/myflowerai/inventory-management.md` for proper inventory tracking implementation.
- User personal fit data must be stored in private per-user storage. See `/docs/myflowerai/personal-fit.md` for proper personal fit tracking implementation.
- Quiz results and generated images must be stored in private database tables. See `/docs/myflowerai/quiz-to-aura.md` for proper quiz-to-aura implementation.

The validation script will automatically reject any strain file containing these prohibited fields.

### Private User Data Storage

The following user data is stored in **private database tables** with user-scoped access controls:

#### Quiz Results Table (`myflowerai_quiz_results`)

Stores quiz completions privately without raw answers:

```sql
CREATE TABLE myflowerai_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  quiz_id VARCHAR(100) NOT NULL,
  persona_id VARCHAR(100) NOT NULL,
  created_month VARCHAR(7) NOT NULL,  -- YYYY-MM only (privacy-safe)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Privacy Features**:
- Only stores resulting persona_id, NOT raw quiz answers
- Timestamps use month-level granularity only
- User-scoped (rows accessible only by owning user)

#### Generated Images Table (`myflowerai_images`)

Stores generated aura images privately:

```sql
CREATE TABLE myflowerai_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  persona_id VARCHAR(100),
  strain_id VARCHAR(255),
  preset_id VARCHAR(100),
  storage_key TEXT NOT NULL,  -- Vercel Blob pathname (not signed URL)
  created_month VARCHAR(7) NOT NULL,  -- YYYY-MM only
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Privacy Features**:
- Storage keys are pathnames, not signed URLs (avoids committing temporary URLs)
- Images stored in Vercel Blob with user-scoped paths: `myflowerai/aura/{user_id}/{timestamp}.png`
- Timestamps use month-level granularity for created_month field
- User-scoped (rows accessible only by owning user)

**Row-Level Security (RLS)**:
If using Postgres with RLS enabled, ensure policies allow users to access only their own rows:

```sql
-- Enable RLS
ALTER TABLE myflowerai_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE myflowerai_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own quiz results
CREATE POLICY quiz_results_user_read ON myflowerai_quiz_results
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own quiz results
CREATE POLICY quiz_results_user_insert ON myflowerai_quiz_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can read their own generated images
CREATE POLICY images_user_read ON myflowerai_images
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own generated images
CREATE POLICY images_user_insert ON myflowerai_images
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

See `/docs/myflowerai/quiz-to-aura.md` for complete quiz-to-aura implementation details.

### Migration from v1.0 to v1.1

A migration script (`scripts/migrate-myflowerai-schema.ts`) is provided to convert v1.0 NDJSON files to v1.1 individual JSON files:

```bash
pnpm tsx scripts/migrate-myflowerai-schema.ts
```

The migration:
1. Removes all private/purchase metadata fields
2. Adds `schema_version: "1.1"`
3. Adds `visibility` section
4. Removes date suffixes from IDs
5. Outputs individual JSON files per strain

### Validation

Schema validation is provided via Zod schema in `lib/validation/myflowerai-schema.ts`.

Run validation:
```bash
pnpm validate:myflowerai
```

This will validate all JSON files in `data/myflowerai/strains/` against the v1.1 schema.

### Backward Compatibility

The loader code in `lib/ai/agents/myflowerai-workflow.ts` supports both v1.0 and v1.1 formats:

- **v1.1 files**: Read directly from `data/myflowerai/strains/*.json`
- **v1.0 files**: Read from `data/myflowerai/strains.ndjson` with automatic field mapping
- **Fallback logic**: If a v1.0 field is accessed but not present in v1.1, gracefully handle with defaults

### Internal-Only Data

For operations requiring private metadata (pricing, exact locations, timestamps), create separate internal schemas:

- **File location**: `data/myflowerai/internal/` (not committed to repo)
- **Schema**: Design as needed for operational requirements
- **Access**: Never expose through client-facing APIs

### Usage Guidelines

**DO:**
- Use v1.1 schema for all client-facing strain data
- Validate all new strain files before committing
- Update internal tools to use v1.1 format
- Keep v1.0 NDJSON for historical reference (not client-facing)

**DON'T:**
- Add personally identifying user information
- Include exact store addresses or GPS coordinates
- Store precise timestamps (dates are acceptable, exact times are not)
- Add purchase prices or financial metadata
- Expose data that could identify individual users or transactions

### Schema Evolution

Future schema changes should:
1. Increment `schema_version` (e.g., "1.2", "2.0")
2. Document all changes in this file
3. Update Zod validation schema
4. Update migration scripts
5. Maintain backward compatibility in loader code

---

## Schema Version 1.0 (Legacy)

The original v1.0 schema was an NDJSON format with mixed client and operational data.

### Key Differences from v1.1

| Field | v1.0 | v1.1 |
|-------|------|------|
| `schema_version` | Not present | `"1.1"` (required) |
| `visibility` | Not present | Required object |
| `product.location` | Exact address | Removed (privacy) |
| `product.price_*` | Included | Removed (purchase data) |
| `sources[].retrieved_at` | Exact timestamp | Removed (operational) |
| `created_at` | Exact timestamp | Removed (operational) |
| `updated_at` | Exact timestamp | Removed (operational) |
| `id` | Date suffix | Date suffix removed |

### Migration Notes

- v1.0 files remain in `data/myflowerai/strains.ndjson` for historical reference
- Loader supports reading v1.0 for backward compatibility
- All new data should use v1.1 format
