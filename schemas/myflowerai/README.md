# MyFlowerAI Schemas

This directory contains JSON schemas for MyFlowerAI data structures.

## Schemas

### Session Log Schema v1.0
**File**: `session-log-v1.schema.json`

**Purpose**: Defines the structure for PRIVATE user session logs. This data tracks individual cannabis consumption sessions with detailed information about method, dose, effects, and context.

**Storage**: Session logs MUST be stored in private per-user storage:
- Supabase user-private tables (recommended)
- Local encrypted storage
- Private JSON namespace (not committed to repo)

**Privacy**: Session logs contain personally identifying information and user consumption history. They must NEVER be stored in public strain JSON files.

**Usage**:
```typescript
import { SessionLogSchemaV1_0 } from '@/lib/validation/session-log-schema';

// Validate a session log
const sessionLog = SessionLogSchemaV1_0.parse(data);
```

**Documentation**: See `/docs/myflowerai/session-logging.md` for complete documentation.

### User Inventory Schema v1.0
**File**: `user-inventory-v1.schema.json`

**Purpose**: Defines the structure for PRIVATE user inventory tracking. This data tracks individual user's cannabis inventory with privacy-safe bucketed amounts and month-level acquisition dates.

**Storage**: Inventory records MUST be stored in private per-user storage:
- Supabase user-private tables (recommended)
- Local encrypted storage
- Private JSON namespace (not committed to repo)

**Privacy**: Inventory records contain user consumption patterns and purchase history. They must NEVER be stored in public strain JSON files. Use month-granularity dates and bucketed amounts (not exact grams).

**Usage**:
```typescript
import { UserInventorySchemaV1_0 } from '@/lib/validation/user-inventory-schema';

// Validate an inventory record
const inventory = UserInventorySchemaV1_0.parse(data);
```

**Documentation**: See `/docs/myflowerai/inventory-management.md` for complete documentation.

### Personal Fit Schema v1.0
**File**: `personal-fit-v1.schema.json`

**Purpose**: Defines the structure for PRIVATE per-user personal fit tracking. This data tracks how well a specific strain works for an individual user, including ratings, personal use case tags, and preferences.

**Storage**: Personal fit records MUST be stored in private per-user storage:
- Supabase user-private tables (recommended)
- Local encrypted storage
- Private JSON namespace (not committed to repo)

**Privacy**: Personal fit records contain user preferences and personal usage patterns. They must NEVER be stored in public strain JSON files. This is separate from public `use_cases` tags in strain data.

**Usage**:
```typescript
import { PersonalFitSchemaV1_0 } from '@/lib/validation/personal-fit-schema';

// Validate a personal fit record
const personalFit = PersonalFitSchemaV1_0.parse(data);
```

**Documentation**: See `/docs/myflowerai/personal-fit.md` for complete documentation.

---

## Schema Validation

All schemas in this directory follow JSON Schema Draft 7 specification.

Validate schemas at: https://www.jsonschemavalidator.net/

## Adding New Schemas

When adding a new schema:

1. Create the JSON schema file following Draft 7 spec
2. Add corresponding TypeScript/Zod schema in `/lib/validation/`
3. Document the schema in this README
4. Add validation tests if applicable
5. Update relevant documentation in `/docs/myflowerai/`

## Related Files

- TypeScript schemas: `/lib/validation/`
- Documentation: `/docs/myflowerai/`
- Public strain data: `/data/myflowerai/strains/`
- Validation scripts: `/scripts/validate-myflowerai-schema.ts`
