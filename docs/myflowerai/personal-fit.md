# MyFlowerAI Personal Fit Tracking

## Overview

Personal fit tracking enables users to record how well specific cannabis strains work for their individual needs and preferences. This system maintains a strict separation between:

- **Public data**: Generic `use_cases` tags in strain information (e.g., "creative", "daytime", "social")
- **Private data**: Per-user `personal_fit` records with ratings and personal notes (stored in private user-specific storage)

## Key Principles

### Privacy-First Architecture

1. **Public strain JSON files contain generic `use_cases` tags** - non-medical, non-personalized guidance
2. **Personal fit data is stored in private per-user storage** (Supabase, local encrypted, or private JSON namespace)
3. **AI agent must ask permission** before storing personal fit data
4. **AI agent never writes personal fit into public strain DB**
5. **Agent suggests tracking fit but does not invent personal medical advice**

### Data Separation

```
Public Strain Data (in /data/myflowerai/strains/):
  use_cases:
    best_for_tags: ["creative", "social", "daytime", "relaxation"]
    avoid_if_tags: ["too_strong_for_newbies", "intense_effects"]

Private User Data (in database personal_fit table):
  rating_1to10: 8
  best_for: ["morning creativity", "weekend projects"]
  avoid_for: ["work meetings", "when anxious"]
  repeat_probability_0to1: 0.9
  notes: "Works great for weekend mornings..."
```

## Personal Fit Schema v1.0

### Purpose
The personal fit schema defines the structure for **private** per-user strain fit tracking. This data captures how well a specific strain works for an individual user, including ratings, personal use case tags, and preferences.

### Storage Locations

Personal fit records MUST be stored in one of these private locations:

1. **Supabase User-Private Tables** (recommended for production)
   - `personal_fit` table with user_id foreign key
   - Row Level Security (RLS) ensures users can only access their own data
   - Encrypted at rest

2. **Local Encrypted Storage**
   - For offline/local-first applications
   - Encrypted using user-specific keys
   - Not synced to public repos

3. **Private JSON Namespace**
   - Separate directory not committed to version control
   - Example: `/data/myflowerai/private-user-data/{user_id}/personal-fit/`
   - Must be in `.gitignore`

### Schema Structure

```typescript
{
  schema_version: "1.0",
  personal_fit_id: string,      // Unique ID for this record
  strain_id: string,             // Reference to public strain data
  privacy: {
    storage_location: "database_user_private" | "local_encrypted" | "private_namespace",
    user_consent: boolean
  },
  rating_1to10?: number,         // User's overall rating (1 = not good, 10 = perfect)
  best_for?: string[],           // Personal tags for what this works best for
  avoid_for?: string[],          // Personal tags for situations to avoid
  repeat_probability_0to1?: number,  // Likelihood of using again (0-1)
  notes?: string,                // Freeform personal notes
  created_at: string,            // ISO 8601 datetime
  updated_at: string             // ISO 8601 datetime
}
```

### Field Descriptions

#### Required Fields

- **schema_version**: Always `"1.0"` for this version
- **personal_fit_id**: Unique identifier (UUID recommended)
- **strain_id**: Must reference an existing strain from public data
- **privacy**: Privacy metadata including storage location and user consent

#### Optional Fields

- **rating_1to10**: User's overall rating from 1 (not a good fit) to 10 (perfect fit for me)
- **best_for**: Array of personal use case strings (user-defined, not from a predefined list)
  - Examples: "morning creativity", "weekend relaxation", "social gatherings", "focused work"
- **avoid_for**: Array of personal caution strings (user-defined)
  - Examples: "work meetings", "mornings", "when anxious", "driving days"
- **repeat_probability_0to1**: Probability (0-1) that user would use this strain again
  - 0.0 = definitely won't use again
  - 0.5 = might use again
  - 1.0 = definitely will use again
- **notes**: Freeform text for any additional personal observations
- **created_at**: ISO 8601 timestamp when record was created
- **updated_at**: ISO 8601 timestamp when record was last updated

## Public Use Cases vs Private Personal Fit

### Public Use Cases (in strain data)

Generic, non-medical tags that describe common use patterns:

```typescript
use_cases: {
  best_for_tags: [
    "creative",
    "social",
    "daytime",
    "nighttime",
    "relaxation",
    "focus",
    "outdoor_activities"
  ],
  avoid_if_tags: [
    "too_strong_for_newbies",
    "intense_effects",
    "may_cause_drowsiness"
  ]
}
```

**Characteristics:**
- Generic and broadly applicable
- Non-medical language
- Based on common user experiences and strain characteristics
- Stored in public strain JSON files
- Same for all users

### Private Personal Fit (per-user)

Personalized ratings and notes specific to an individual:

```typescript
personal_fit: {
  rating_1to10: 8,
  best_for: [
    "morning creativity sessions",
    "weekend coding projects",
    "solo brainstorming"
  ],
  avoid_for: [
    "work meetings",
    "social events with new people",
    "when I need to drive"
  ],
  repeat_probability_0to1: 0.85,
  notes: "Works really well for creative work but makes me too introspective for social situations. Perfect Saturday morning strain."
}
```

**Characteristics:**
- Highly personalized to individual user
- User-defined tags and descriptions
- Includes user's subjective ratings and likelihood of reuse
- Stored in private per-user database
- Different for each user

## AI Agent Behavior Guidelines

### Permission and Consent

1. **Always ask permission before storing personal fit data**
   - Example: "Would you like me to save these preferences for this strain?"
   - Confirm user consent before writing to personal_fit table

2. **Explain what will be stored and how it's private**
   - Example: "I can save this as a private note that only you can see. This won't affect the public strain information."

3. **Respect user privacy choices**
   - If user declines, don't save personal fit data
   - User can always add personal fit later

### What Agent CAN Do

1. **Suggest tracking personal fit**
   - "It sounds like this strain works well for you. Would you like to save your experience?"
   
2. **Reference public use_cases tags from strain data**
   - "This strain is tagged for 'creative' and 'daytime' use in the strain database."

3. **Help user create personal_fit records**
   - Ask questions to fill out rating, best_for, avoid_for, etc.
   - Store in private personal_fit table after getting consent

4. **Analyze user's personal_fit history**
   - "Looking at your personal ratings, you tend to prefer strains with..."
   - Compare personal experiences across different strains

### What Agent CANNOT Do

1. **Never invent personal medical advice**
   - ❌ "This strain will help with your anxiety"
   - ✅ "Some users find this helpful for relaxation. Would you like to track how it works for you?"

2. **Never write personal fit data into public strain files**
   - Personal ratings, notes, and preferences stay in private storage only

3. **Never assume or predict personal fit without user input**
   - ❌ "Based on your profile, you'll rate this 9/10"
   - ✅ "After you try it, I can help you track your experience if you'd like"

4. **Never share personal fit data between users**
   - Each user's personal_fit data is private and isolated

### Example Conversations

#### Good: Agent suggests tracking with consent

**User:** "Wow, this Juicy Jane strain is perfect for my morning routine!"

**Agent:** "That's great to hear! Would you like me to save this as a personal note? I can track that Juicy Jane works well for your morning routine, and you can add a rating if you want. This will be private and just for you."

**User:** "Yes, please!"

**Agent:** "Perfect! On a scale of 1-10, how would you rate how well this strain fits your needs? And are there specific situations you'd recommend it for or avoid it for?"

#### Bad: Agent invents medical advice

**User:** "I have anxiety, what strain should I use?"

**Agent:** ❌ "Try Juicy Jane - it will help with your anxiety because it has 2.5% terpenes."

**Correct approach:** ✅ "I can share general information about strains and their typical effects, but I can't provide medical advice. If you're managing anxiety, please consult with a healthcare provider. I can help you track which strains you personally find helpful once you try them, if you'd like to keep private notes on what works for you."

#### Good: Agent references public data

**User:** "Tell me about White Sunshine."

**Agent:** "White Sunshine is a hybrid strain. According to the strain data, it's commonly used for daytime and has tags for 'uplifting' effects. Would you like more details about its terpene profile or cannabinoid content?"

#### Bad: Agent writes personal data to public files

**User:** "I'd rate this strain 9/10 for weekend mornings."

**Agent:** ❌ *Writes rating_1to10: 9 and best_for: ["weekend mornings"] into public strain JSON file*

**Correct approach:** ✅ "Great! I'll save that as a private note in your personal fit tracking. Your rating and preferences will only be visible to you."

## Database Schema

### Table: personal_fit

```sql
CREATE TABLE personal_fit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  schema_version VARCHAR(10) DEFAULT '1.0' NOT NULL,
  personal_fit_id UUID UNIQUE DEFAULT gen_random_uuid() NOT NULL,
  strain_id VARCHAR(255) NOT NULL,
  storage_location VARCHAR(50) DEFAULT 'database_user_private' NOT NULL,
  user_consent BOOLEAN DEFAULT false NOT NULL,
  rating_1to10 VARCHAR(10),
  best_for TEXT[],
  avoid_for TEXT[],
  repeat_probability_0to1 VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Row Level Security (RLS)

When using Supabase, apply RLS policies:

```sql
-- Enable RLS
ALTER TABLE personal_fit ENABLE ROW LEVEL SECURITY;

-- Users can only see their own personal fit data
CREATE POLICY "Users can view own personal fit"
  ON personal_fit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own personal fit data
CREATE POLICY "Users can insert own personal fit"
  ON personal_fit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own personal fit data
CREATE POLICY "Users can update own personal fit"
  ON personal_fit
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own personal fit data
CREATE POLICY "Users can delete own personal fit"
  ON personal_fit
  FOR DELETE
  USING (auth.uid() = user_id);
```

## API Integration

### Storing Personal Fit Data

```typescript
import { PersonalFitSchemaV1_0 } from '@/lib/validation/personal-fit-schema';
import { db } from '@/lib/db';
import { personalFit } from '@/lib/db/schema';

// After getting user consent
async function savePersonalFit(userId: string, data: {
  strain_id: string;
  rating_1to10?: number;
  best_for?: string[];
  avoid_for?: string[];
  repeat_probability_0to1?: number;
  notes?: string;
}) {
  // Validate with schema
  const validated = PersonalFitSchemaV1_0.parse({
    schema_version: "1.0",
    personal_fit_id: crypto.randomUUID(),
    strain_id: data.strain_id,
    privacy: {
      storage_location: "database_user_private",
      user_consent: true
    },
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Insert into database
  await db.insert(personalFit).values({
    userId: userId,
    strainId: data.strain_id,
    rating1to10: data.rating_1to10?.toString(),
    bestFor: data.best_for,
    avoidFor: data.avoid_for,
    repeatProbability0to1: data.repeat_probability_0to1?.toString(),
    notes: data.notes,
    userConsent: true
  });
}
```

### Retrieving Personal Fit Data

```typescript
async function getUserPersonalFit(userId: string, strainId: string) {
  const result = await db
    .select()
    .from(personalFit)
    .where(
      and(
        eq(personalFit.userId, userId),
        eq(personalFit.strainId, strainId)
      )
    )
    .limit(1);

  return result[0] || null;
}
```

## Testing and Validation

### Schema Validation

Test that personal fit data conforms to schema:

```typescript
import { PersonalFitSchemaV1_0 } from '@/lib/validation/personal-fit-schema';

const testData = {
  schema_version: "1.0",
  personal_fit_id: "123e4567-e89b-12d3-a456-426614174000",
  strain_id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g-2026-01-25",
  privacy: {
    storage_location: "database_user_private",
    user_consent: true
  },
  rating_1to10: 8,
  best_for: ["morning creativity", "weekend projects"],
  avoid_for: ["work meetings"],
  repeat_probability_0to1: 0.85,
  notes: "Great for creative work"
};

// Should not throw
PersonalFitSchemaV1_0.parse(testData);
```

### Privacy Validation

Verify that personal fit data never ends up in public strain files:

```typescript
// This should NEVER happen
const strainData = loadStrainData("strain-id");
if ('personal_fit' in strainData || 'rating_1to10' in strainData) {
  throw new Error("Personal fit data leaked into public strain data!");
}
```

## Migration from Existing Data

If you have existing personal notes in the `your_notes` field of strain data:

1. **Do not migrate automatically** - this requires user consent
2. **Prompt user to migrate**:
   ```
   "I noticed you have some personal notes in the strain data. 
   Would you like to move these to your private personal fit tracking?"
   ```
3. **After consent, migrate**:
   - Extract `rating_1to10` → personal_fit.rating_1to10
   - Extract `felt_like` → personal_fit.best_for
   - Extract `avoid_if` → personal_fit.avoid_for
   - Clear personal data from public strain files

## Summary

Personal fit tracking allows users to record personalized strain preferences while maintaining strict privacy boundaries:

- ✅ Public strains have generic `use_cases` tags
- ✅ Private `personal_fit` table stores per-user ratings and notes
- ✅ Agent asks permission before storing personal data
- ✅ Agent never writes personal fit to public strain files
- ✅ Agent suggests tracking but doesn't invent medical advice

This design ensures users can benefit from personalized tracking while keeping their private data secure and preventing the AI from making inappropriate medical claims.
