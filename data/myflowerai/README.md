# MyFlowerAI Data Migration

This directory contains the migration tools and scripts for converting MyFlowerAI strain data from schema v1.0 to v1.1.

## Quick Start

### Validate Existing Data
```bash
pnpm validate:myflowerai
```

### Migrate v1.0 to v1.1
```bash
pnpm migrate:myflowerai
```

## What Changed in v1.1?

Schema v1.1 is a **client-safe** format that removes all private metadata and purchase information:

### ✅ Kept (Client-Safe Data)
- Strain information (name, type, brand, lineage)
- Cannabinoid profiles (THC, CBD, terpenes)
- COA summary (lab results, batch info)
- Product descriptions and vibes
- Tags for search/filtering
- User notes section

### ❌ Removed (Private/Purchase Data)
- `product.location` - Exact store address
- `product.price_current_usd` - Current price
- `product.price_original_usd` - Original price
- `sources[].retrieved_at` - Exact retrieval timestamps
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

### ➕ Added (New in v1.1)
- `schema_version: "1.1"` - Version identifier
- `visibility` - Documents excluded fields and client-safe status

## File Structure

### Before (v1.0)
```
data/myflowerai/
└── strains.ndjson          # Single NDJSON file with all strains
```

### After (v1.1)
```
data/myflowerai/
├── strains.ndjson          # Kept for backward compatibility
└── strains/                # Individual JSON files (v1.1)
    ├── strain-1.json
    ├── strain-2.json
    └── strain-3.json
```

## Scripts

### Migration Script
`scripts/migrate-myflowerai-schema.ts`
- Reads v1.0 NDJSON format
- Removes private fields
- Adds v1.1 metadata
- Writes individual JSON files

### Validation Script
`scripts/validate-myflowerai-schema.ts`
- Validates all JSON files against v1.1 schema
- Reports errors with detailed messages
- Exits with error code 1 if validation fails

## Loader Compatibility

The loader in `lib/ai/agents/myflowerai-workflow.ts` supports both formats:

1. **Primary**: Loads v1.1 from `data/myflowerai/strains/*.json`
2. **Fallback**: Loads v1.0 from `data/myflowerai/strains.ndjson`

This ensures backward compatibility while preferring the new format.

## CI Integration

GitHub Actions workflow validates strain data on:
- Push to `data/myflowerai/strains/**`
- Changes to validation schema or scripts

See `.github/workflows/validate-myflowerai.yml`

## Documentation

Full schema documentation: `/docs/myflowerai/schema.md`

## For Developers

### Adding New Strains

1. Create JSON file in `data/myflowerai/strains/`
2. Use v1.1 schema format
3. Run `pnpm validate:myflowerai` to verify
4. Commit and push

### Modifying Schema

1. Update Zod schema in `lib/validation/myflowerai-schema.ts`
2. Update documentation in `docs/myflowerai/schema.md`
3. Increment version if breaking changes
4. Re-run migration if needed

## Security Notes

**Never commit these to v1.1 files:**
- Personally identifying information
- Exact store addresses or GPS coordinates
- Precise timestamps (dates are OK, exact times are not)
- Purchase prices or financial data
- Data that could identify individual users
- **User session logs** - Use private storage instead (see Session Logging below)

For internal operations requiring this data, use a separate internal-only schema.

## Session Logging

MyFlowerAI supports session logging for tracking user cannabis consumption experiences.

### Privacy-Safe Architecture

- **Public strain files** contain `session_template` - guidance for AI agents
- **Private user data** (actual session logs) stored separately in Supabase or private storage
- **NEVER commit** `sessions`, `session_logs`, or `user_sessions` arrays to public strain files

### Adding Session Templates to Strains

Strain files can include an optional `session_template` to guide AI agents:

```json
{
  "session_template": {
    "suggested_methods": ["joint", "vaporizer_dry_herb"],
    "suggested_dose_guidance_text": "Start with 0.25-0.5g for moderate experience",
    "recommended_questions": [
      "What method did you use?",
      "How much did you use?",
      "What effects did you notice?"
    ]
  }
}
```

### Documentation

- Full session logging guide: `/docs/myflowerai/session-logging.md`
- Session log schema: `/schemas/myflowerai/session-log-v1.schema.json`
- TypeScript schema: `/lib/validation/session-log-schema.ts`

### Validation

The validation script automatically rejects strain files containing user session data:

```bash
pnpm validate:myflowerai
```

This ensures privacy is maintained in public files.
