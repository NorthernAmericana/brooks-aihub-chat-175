# MyFlowerAI Inventory and Freshness Management

## Overview

The inventory and freshness management system enables users to track their cannabis inventory in a **privacy-safe** manner while providing public freshness guidance for all strains. This system maintains a strict separation between:

- **Public data**: Freshness guidance and packaging recommendations (stored in `/data/myflowerai/strains/`)
- **Private data**: User inventory records (stored in private per-user storage)

## Key Principles

### Privacy-First Architecture

1. **Public strain JSON files MUST NOT contain user inventory data**
2. **Inventory records are stored in private per-user storage** (Database with application-level access control, local encrypted, or private namespace)
3. **Public strain files include `freshness_guidance` and `packaging`** - general guidance for all users
4. **User consent is required** before storing any inventory data
5. **No exact amounts, dates, or locations** - use bucketed/aggregated values for privacy

### Data Flow

```
Public Strain Data (freshness_guidance, packaging) → AI Agent provides general guidance →
User opts in to track inventory → Private inventory record created →
Stored in PRIVATE user storage (never in public strain files)
```

## Public Fields (Strain Schema)

### `freshness_guidance` (Optional)

Provides general guidance on cannabis freshness and storage best practices. This is PUBLIC information available to all users.

#### Schema Structure

```typescript
{
  freshness_guidance?: {
    best_storage: string,                    // General storage recommendations
    typical_shelf_life_days: number,         // Expected shelf life in days
    notes?: string,                          // Additional freshness notes
    do_not_store_in_public: string[]        // Reminder of prohibited fields
  }
}
```

#### Example

```json
{
  "freshness_guidance": {
    "best_storage": "Store in an airtight container in a cool, dark place. Ideal temperature is 60-70°F (15-21°C) with 59-63% relative humidity.",
    "typical_shelf_life_days": 180,
    "notes": "Flower quality begins to degrade after opening. Terpenes are volatile and evaporate over time. Use within 3-6 months of purchase for optimal experience.",
    "do_not_store_in_public": [
      "opened_date",
      "remaining_g",
      "purchase_date",
      "purchase_location",
      "user_stash_amount"
    ]
  }
}
```

#### Field Descriptions

- **best_storage**: Natural language description of optimal storage conditions (temperature, humidity, container type, light exposure)
- **typical_shelf_life_days**: Expected shelf life in days under optimal storage conditions (unopened)
- **notes**: Additional context about freshness degradation, terpene preservation, or usage recommendations
- **do_not_store_in_public**: Array of field names that should NEVER be added to public strain files (documentation/reminder)

### `packaging` (Optional)

Provides recommendations for cannabis storage containers and accessories. This is PUBLIC information.

#### Schema Structure

```typescript
{
  packaging?: {
    container_type_suggestions: string[],    // Recommended container types
    humidipack_recommended: boolean          // Whether humidity control is recommended
  }
}
```

#### Example

```json
{
  "packaging": {
    "container_type_suggestions": [
      "Glass jar with airtight seal",
      "CVault container",
      "Mason jar"
    ],
    "humidipack_recommended": true
  }
}
```

#### Field Descriptions

- **container_type_suggestions**: Array of recommended container types for optimal storage
- **humidipack_recommended**: Boolean indicating whether a humidity control pack (like Boveda) is recommended

## Private Fields (User Inventory Schema)

### User Inventory Schema v1.0

Defines the structure for **PRIVATE** user inventory data. This tracks individual user's cannabis inventory.

### Storage Locations

Inventory records MUST be stored in one of these private locations:

1. **Database User-Private Table** (recommended for production)
   - Table: `user_inventory` with user_id foreign key
   - Application-level access control ensures users can only access their own inventory records
   - Access is enforced by filtering all queries with the authenticated user's ID
   - Encrypted at rest

2. **Local Encrypted Storage**
   - For offline/local-first applications
   - Encrypted using user-specific keys
   - Not synced to public repositories

3. **Private JSON Namespace**
   - Separate directory not committed to version control
   - Example: `/data/myflowerai/private-user-data/{user_id}/inventory/`
   - Must be in `.gitignore`

### Schema Structure

```typescript
{
  schema_version: "1.0",
  inventory_id: string,              // Unique ID (UUID)
  strain_id: string,                 // Reference to public strain
  privacy: {
    storage_location: "database_user_private" | "local_encrypted" | "private_namespace",
    user_consent: boolean
  },
  acquired_month?: string,           // YYYY-MM (month granularity only)
  opened?: boolean,                  // Container opened status
  remaining_estimate?: "full" | "half" | "low" | "empty",  // Bucketed amount
  storage_type?: "glass_jar_airtight" | "original_container" | "cvault" | 
                 "mason_jar" | "plastic_container" | "other",
  storage_conditions?: {
    has_humidipack?: boolean,
    location?: "dark_cool_place" | "drawer" | "cabinet" | "fridge" | "other"
  },
  quality_notes?: string,
  tags?: string[],
  created_at?: string,               // ISO 8601
  updated_at?: string                // ISO 8601
}
```

### Privacy Design Choices

#### Month Granularity Only
- **Field**: `acquired_month` uses `YYYY-MM` format (e.g., "2026-01")
- **Why**: Exact purchase dates could be used to identify users or track shopping patterns
- **Acceptable**: Month-level data for freshness estimates without privacy risk

#### Bucketed Amount Estimates
- **Field**: `remaining_estimate` uses `"full" | "half" | "low" | "empty"`
- **Why**: Exact gram amounts could reveal consumption rates and shopping patterns
- **Acceptable**: Rough estimates for freshness tracking without detailed consumption data

#### General Storage Locations
- **Field**: `storage_conditions.location` uses types like `"dark_cool_place"`
- **Why**: Specific addresses or GPS coordinates are privacy violations
- **Acceptable**: General location types that don't identify specific places

### Example Inventory Record

```json
{
  "schema_version": "1.0",
  "inventory_id": "550e8400-e29b-41d4-a716-446655440001",
  "strain_id": "trulieve-sunshine-cannabis-white-sunshine-3p5g",
  "privacy": {
    "storage_location": "database_user_private",
    "user_consent": true
  },
  "acquired_month": "2026-01",
  "opened": true,
  "remaining_estimate": "half",
  "storage_type": "glass_jar_airtight",
  "storage_conditions": {
    "has_humidipack": true,
    "location": "dark_cool_place"
  },
  "quality_notes": "Still fresh and aromatic. Terpenes holding up well.",
  "tags": ["active", "favorite"],
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-27T15:00:00Z"
}
```

## AI Agent Integration

### How AI Uses Freshness Guidance

When a user asks about cannabis storage or freshness, the AI agent should:

1. **Consult public `freshness_guidance`** from strain data for general recommendations
2. **Consult public `packaging`** for container and humidity pack recommendations
3. **NEVER reveal specific inventory details** in responses
4. **Use bucketed/generalized language** when discussing user's inventory

### Example Conversation Flows

#### Providing Storage Guidance (No Private Data)

```
User: "How should I store White Sunshine?"

Agent: (Loads strain data, reads freshness_guidance)
Agent: "For White Sunshine, I recommend storing it in an airtight glass jar in a 
        cool, dark place. The ideal temperature is 60-70°F with 59-63% relative 
        humidity. A humidity control pack like Boveda is recommended. Under optimal 
        conditions, flower can stay fresh for about 6 months unopened, though 
        quality begins to degrade after opening."
```

#### Using Private Inventory (With User Consent)

```
User: "How fresh is my White Sunshine?"

Agent: (Checks user_inventory in PRIVATE storage with user's consent)
Agent: (Sees: acquired_month: "2025-12", opened: true, remaining_estimate: "half")
Agent: "You've had this strain for about a month and it's been opened. With proper 
        storage in your airtight container with a humidity pack, it should still 
        be quite fresh. Watch for any changes in aroma or texture, but it should 
        have several more months of good quality remaining."

Note: Agent does NOT say exact date or amount, uses generalized language.
```

#### Inventory Tracking (Opt-In)

```
User: "Can you help me track what I have?"

Agent: "I can help you track your inventory privately and securely. This would let 
        me give you freshness reminders and help you manage your collection. Your 
        inventory data would be stored privately and never shared. Would you like 
        to enable inventory tracking?"

User: "Yes"

Agent: "Great! I'll need a few details. What strain are you tracking?"

User: "White Sunshine, the 3.5g from Trulieve"

Agent: "When did you get it? Just the month is fine."

User: "Last month"

Agent: "Have you opened it yet?"

User: "Yes, I've used about half"

Agent: (Creates private inventory record)
Agent: "Perfect! I've added White Sunshine to your inventory. I'll help you track 
        its freshness and can remind you to check on it periodically."
```

### Implementation Guidelines for Developers

#### ✅ CORRECT: Store in Private User Storage

```typescript
async function createInventoryRecord(
  userId: string, 
  inventoryData: UserInventoryV1_0
) {
  // Store in database with user_id for access control
  const { data, error } = await db
    .insert(userInventory)
    .values({
      userId: userId,
      ...inventoryData
    })
    .returning();
  
  return data;
}

async function getUserInventory(userId: string) {
  // IMPORTANT: Always filter by userId to ensure users can only access their own data
  return await db
    .select()
    .from(userInventory)
    .where(eq(userInventory.userId, userId));
}

async function getInventoryFreshnessAdvice(
  userId: string,
  inventoryId: string
) {
  // 1. Get private inventory record (filtered by userId for security)
  const inventory = await db
    .select()
    .from(userInventory)
    .where(
      and(
        eq(userInventory.userId, userId),
        eq(userInventory.inventoryId, inventoryId)
      )
    )
    .limit(1);
  
  if (!inventory.length) return null;
  
  // 2. Get public strain data
  const strain = await getPublicStrainData(inventory[0].strainId);
  
  // 3. Calculate freshness based on acquired_month and shelf_life
  const monthsOld = calculateMonthsSince(inventory[0].acquiredMonth);
  const shelfLifeMonths = strain.freshness_guidance.typical_shelf_life_days / 30;
  
  // 4. Provide generalized advice without revealing exact dates
  if (monthsOld < shelfLifeMonths / 2) {
    return "Your strain is still quite fresh!";
  } else if (monthsOld < shelfLifeMonths) {
    return "Your strain should still be good, but use it soon for best quality.";
  } else {
    return "Your strain may be past its optimal freshness. Check the aroma and texture.";
  }
}
```

#### ❌ WRONG: Never Add to Public Strain Files

```typescript
// ❌ DON'T DO THIS!
async function addInventoryToStrainFile(inventoryData: UserInventoryV1_0) {
  const strainFile = readStrainFile(inventoryData.strain_id);
  strainFile.user_inventory = inventoryData; // ❌ NO!
  writeStrainFile(strainFile); // ❌ NO!
}

// ❌ DON'T DO THIS!
const strainData = {
  ...publicStrainFields,
  inventory: { // ❌ NO!
    opened_date: "2026-01-15",
    remaining_g: 1.8,
    purchase_location: "123 Main St"
  }
};
```

## Database Schema

### User Inventory Table

```sql
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  schema_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  inventory_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  strain_id VARCHAR(255) NOT NULL,
  
  -- Privacy metadata
  storage_location VARCHAR(50) NOT NULL DEFAULT 'database_user_private',
  user_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Inventory details (privacy-safe)
  acquired_month VARCHAR(7),  -- YYYY-MM format
  opened BOOLEAN DEFAULT false,
  remaining_estimate VARCHAR(20),  -- full, half, low, empty
  storage_type VARCHAR(50),
  has_humidipack BOOLEAN,
  storage_location_type VARCHAR(50),
  quality_notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT acquired_month_format CHECK (acquired_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

-- Foreign key constraint
ALTER TABLE user_inventory 
  ADD CONSTRAINT user_inventory_user_id_User_id_fk 
  FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;

-- Note: This application uses application-level access control.
-- Queries should always filter by user_id matching the authenticated user's ID
-- to ensure users can only access their own inventory records.

-- Index for performance
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_strain_id ON user_inventory(strain_id);
```

## Validation and Linting

### Preventing Privacy Violations

The validation script (`scripts/validate-myflowerai-schema.ts`) should be updated to:

1. **Reject `inventory`, `user_inventory`, or similar arrays** in public strain files
2. **Validate `freshness_guidance` and `packaging` schemas** (if present)
3. **Ensure no exact dates, locations, or amounts** in public files

### Running Validation

```bash
# Validate all strain files
pnpm validate:myflowerai

# This will fail if any strain file contains:
# - "inventory": [...]
# - "user_inventory": [...]
# - Purchase dates or locations
# - Exact stash amounts
```

## Migration Guide

### Adding Freshness Guidance to Existing Strains

1. Edit the strain JSON file
2. Add `freshness_guidance` object with appropriate values
3. Add `packaging` object with container and humidipack recommendations
4. Run validation: `pnpm validate:myflowerai`
5. Commit if validation passes

### Setting Up User Inventory

1. Run database migration to create `user_inventory` table
2. Update AI agent to use inventory when user opts in
3. Ensure all inventory queries filter by authenticated user's ID
4. Test with sample data in development environment

## Security Best Practices

### For Developers

1. **Never log private inventory data to console** in production
2. **Always require user consent** before storing inventory data
3. **Enforce access control at application layer** - filter all queries by authenticated user's ID
4. **Encrypt inventory data at rest** and in transit
5. **Provide data export/deletion** features to comply with privacy regulations
6. **Add inventory files to `.gitignore`** if using local file storage
7. **Use bucketed values** (not exact amounts) for privacy
8. **Use month granularity** (not exact dates) for acquisition dates

### For Content Editors

1. **Never add `inventory` fields** to public strain JSON files
2. **`freshness_guidance` and `packaging` are public** - keep them general
3. **Run validation before committing** strain data changes
4. **Review PR diffs carefully** to ensure no private data is being committed

## Future Enhancements

Potential future additions:

- **Schema v1.1**: Add expiration alerts/notifications
- **Schema v1.2**: Add batch/lot tracking for recalls
- **Analytics**: Aggregate freshness patterns (privacy-safe)
- **API endpoints**: RESTful API for inventory CRUD operations
- **Mobile app**: Barcode scanning for quick inventory addition
- **Freshness scoring**: AI-powered freshness recommendations

## References

- User Inventory JSON Schema: `/schemas/myflowerai/user-inventory-v1.schema.json`
- User Inventory TypeScript Schema: `/lib/validation/user-inventory-schema.ts`
- Strain Schema Documentation: `/docs/myflowerai/schema.md`
- Session Logging Documentation: `/docs/myflowerai/session-logging.md`
- Example Strain with Freshness: `/data/myflowerai/strains/EXAMPLE-TEMPLATE.json`
- Database Migration: `/lib/db/migrations/0019_add_user_inventory.sql`
