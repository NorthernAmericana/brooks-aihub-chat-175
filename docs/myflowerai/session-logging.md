# MyFlowerAI Session Logging

## Overview

Session logging enables users to track their cannabis consumption experiences over time in a **privacy-safe** manner. This system maintains a clear separation between:

- **Public data**: Strain information and guidance (stored in `/data/myflowerai/strains/`)
- **Private data**: User session logs and personal consumption history (stored in private user-specific storage)

## Key Principles

### Privacy-First Architecture

1. **Public strain JSON files MUST NOT contain user session logs**
2. **Session logs are stored in private per-user storage** (Supabase, local encrypted, or private JSON namespace)
3. **Public strain files include `session_template`** - guidance for AI agents on what questions to ask
4. **User consent is required** before storing any session data

### Data Flow

```
User Session → AI Agent asks questions from session_template → 
User responses → Session log created → 
Stored in PRIVATE user storage (never in public strain files)
```

## Session Log Schema v1.0

### Purpose
The session log schema defines the structure for **private** user session data. This data captures detailed consumption experiences including method, dose, effects, and context.

### Storage Locations

Session logs MUST be stored in one of these private locations:

1. **Supabase User-Private Tables** (recommended for production)
   - Per-user table with RLS (Row Level Security)
   - User can only access their own session logs
   - Encrypted at rest

2. **Local Encrypted Storage**
   - For offline/local-first applications
   - Encrypted using user-specific keys
   - Not synced to public repos

3. **Private JSON Namespace**
   - Separate directory not committed to version control
   - Example: `/data/myflowerai/private-user-data/{user_id}/sessions/`
   - Must be in `.gitignore`

### Schema Structure

```typescript
{
  schema_version: "1.0",
  session_id: string,           // Unique ID for this session
  strain_id: string,            // Reference to public strain data
  timestamp: string,            // ISO 8601 datetime
  privacy: {
    storage_location: "supabase_user_private" | "local_encrypted" | "private_namespace",
    user_consent: boolean
  },
  method: "joint" | "blunt" | "pipe" | "bong" | "vaporizer_dry_herb" | 
          "vaporizer_concentrate" | "edible" | "tincture" | "topical" | "other",
  dose_estimate?: {
    amount_g?: number,
    confidence?: "exact" | "approximate" | "guess",
    notes?: string
  },
  timing?: {
    time_of_day?: "morning" | "afternoon" | "evening" | "night",
    duration_minutes?: number
  },
  context?: {
    setting?: "home" | "outdoors" | "social" | "work" | "travel" | "other",
    activity?: string,
    mood_before?: string,
    intention?: string
  },
  effects_positive?: string[],
  effects_negative?: string[],
  intensity_1to10?: number,      // 1 = very mild, 10 = very intense
  outcome_tags?: string[],       // e.g., ["productive", "relaxing", "social"]
  notes?: string,
  follow_up?: {
    would_use_again?: boolean,
    next_time_adjust?: string
  }
}
```

### Field Descriptions

#### Required Fields

- **schema_version**: Always `"1.0"` for this version
- **session_id**: Unique identifier (UUID recommended)
- **strain_id**: Must reference an existing strain from public data
- **timestamp**: When the session occurred (ISO 8601 format)
- **privacy**: Privacy metadata including storage location and user consent
- **method**: How the cannabis was consumed

#### Optional Fields

- **dose_estimate**: Approximate amount consumed and confidence level
- **timing**: When and how long the session lasted
- **context**: Environmental and intentional context
- **effects_positive**: Array of positive effects experienced
- **effects_negative**: Array of negative effects or side effects
- **intensity_1to10**: Subjective intensity rating (1-10 scale)
- **outcome_tags**: High-level tags describing the session outcome
- **notes**: Freeform text notes
- **follow_up**: Post-session reflections and adjustments for next time

### Example Session Log

```json
{
  "schema_version": "1.0",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "strain_id": "trulieve-sunshine-cannabis-white-sunshine-3p5g",
  "timestamp": "2026-01-27T14:30:00Z",
  "privacy": {
    "storage_location": "supabase_user_private",
    "user_consent": true
  },
  "method": "vaporizer_dry_herb",
  "dose_estimate": {
    "amount_g": 0.3,
    "confidence": "approximate",
    "notes": "About half a bowl"
  },
  "timing": {
    "time_of_day": "afternoon",
    "duration_minutes": 90
  },
  "context": {
    "setting": "home",
    "activity": "Working on creative project",
    "mood_before": "Focused but a bit tense",
    "intention": "Stay creative but relaxed"
  },
  "effects_positive": [
    "Enhanced creativity",
    "Relaxed body",
    "Maintained focus",
    "Uplifted mood"
  ],
  "effects_negative": [
    "Slight dry mouth"
  ],
  "intensity_1to10": 6,
  "outcome_tags": ["productive", "creative", "balanced"],
  "notes": "Perfect for afternoon creative work. The hybrid balance kept me focused without anxiety. Would use this strain again for similar situations.",
  "follow_up": {
    "would_use_again": true,
    "next_time_adjust": "Maybe try slightly less (0.25g) in the morning"
  }
}
```

## Session Template (Public)

### Purpose
The `session_template` field in public strain JSON files provides guidance to AI agents on:
1. What consumption methods are appropriate for this strain
2. Dosing guidance based on strain potency and characteristics  
3. What questions to ask users when creating session logs

### Schema Structure

```typescript
{
  suggested_methods?: string[],            // Recommended consumption methods
  suggested_dose_guidance_text?: string,   // Natural language dosing advice
  recommended_questions?: string[]         // Questions for AI to ask user
}
```

### Example Session Template

```json
{
  "session_template": {
    "suggested_methods": [
      "joint",
      "vaporizer_dry_herb",
      "bong"
    ],
    "suggested_dose_guidance_text": "This is a potent hybrid (27.5% THC). Start with 0.25g if inexperienced. Good for daytime energy with balanced calm.",
    "recommended_questions": [
      "What method did you use to consume this strain?",
      "Approximately how much did you use?",
      "What time of day was it, and what were you doing?",
      "How did you feel before using it?",
      "What positive effects did you notice?",
      "Were there any negative effects or discomfort?",
      "On a scale of 1-10, how intense was the experience?",
      "Did it help you achieve what you were looking for?",
      "Would you use this strain again?"
    ]
  }
}
```

## AI Agent Integration

### Agent Behavior

When a user mentions they're using or have used a strain, the AI agent should:

1. **Check for session_template** in the strain data
2. **Use recommended_questions** to gather session information through natural conversation
3. **Store responses in private user storage** using the session log schema
4. **NEVER write session data back into public strain JSON files**

### Example Conversation Flow

```
User: "I just tried White Sunshine"

Agent: (Loads strain data, sees session_template)
Agent: "Nice! White Sunshine is a potent hybrid. Would you like to log this session? 
        I can help you track your experience."

User: "Sure!"

Agent: (Uses recommended_questions from session_template)
Agent: "Great! What method did you use - vaporizer, joint, or something else?"

User: "Vaporizer"

Agent: "And about how much did you use? Just a rough estimate is fine."

User: "Maybe a third of a gram, I think?"

Agent: (Continues with other questions, then creates session log in PRIVATE storage)
Agent: "Thanks! I've saved your session log privately. I can help you compare 
        this to your other sessions with different strains anytime."
```

### Implementation Notes for Developers

```typescript
// ✅ CORRECT: Store in private user storage
async function saveSessionLog(userId: string, sessionData: SessionLogV1_0) {
  // Store in Supabase with RLS
  await supabase
    .from('user_session_logs')
    .insert({
      user_id: userId,
      ...sessionData
    });
}

// ❌ WRONG: Never do this!
async function saveSessionLog(sessionData: SessionLogV1_0) {
  // Don't write session logs to public strain files!
  const strainFile = readStrainFile(sessionData.strain_id);
  strainFile.sessions.push(sessionData); // ❌ NO!
  writeStrainFile(strainFile); // ❌ NO!
}
```

## Validation and Linting

### Preventing Privacy Violations

The validation script (`scripts/validate-myflowerai-schema.ts`) has been updated to:

1. **Reject any `sessions` or `session_logs` arrays** in public strain files
2. **Ensure session_template follows the correct schema** (if present)
3. **Verify no personally identifying information** in public files

### Running Validation

```bash
# Validate all strain files
pnpm validate:myflowerai

# This will fail if any strain file contains:
# - "sessions": [...]
# - "session_logs": [...]
# - Other privacy-violating fields
```

### CI/CD Integration

The GitHub Actions workflow (`.github/workflows/validate-myflowerai.yml`) automatically validates all strain files on push/PR to prevent accidental commits of private data.

## Migration and Compatibility

### Adding Session Templates to Existing Strains

Existing strain files without `session_template` will continue to work normally. The field is optional.

To add a session_template:

1. Edit the strain JSON file
2. Add the `session_template` object before the closing brace
3. Run validation: `pnpm validate:myflowerai`
4. Commit if validation passes

### Default Questions

If a strain doesn't have a `session_template`, the AI agent can use default questions from `DEFAULT_SESSION_QUESTIONS` in `/lib/validation/session-log-schema.ts`.

## Security Best Practices

### For Developers

1. **Never log private session data to console** in production
2. **Always require user consent** before storing session data
3. **Use RLS (Row Level Security)** in Supabase to ensure users can only access their own data
4. **Encrypt session logs at rest** and in transit
5. **Provide data export/deletion** features to comply with privacy regulations
6. **Add session logs to `.gitignore`** if using local file storage

### For Content Editors

1. **Never add `sessions` arrays** to public strain JSON files
2. **session_template is public** - don't include personal information
3. **Run validation before committing** strain data changes
4. **Review PR diffs carefully** to ensure no private data is being committed

## Future Enhancements

Potential future additions to session logging:

- **Schema v1.1**: Add biometric data integration (heart rate, sleep quality)
- **Schema v1.2**: Add social/group session support
- **Schema v2.0**: Add long-term trend analysis fields
- **API endpoints**: RESTful API for session log CRUD operations
- **Data export**: CSV/JSON export for user data portability
- **Analytics dashboard**: Visualizations of session trends over time

## References

- Session Log JSON Schema: `/schemas/myflowerai/session-log-v1.schema.json`
- Session Log TypeScript Schema: `/lib/validation/session-log-schema.ts`
- Strain Schema Documentation: `/docs/myflowerai/schema.md`
- Example Strain with Template: `/data/myflowerai/strains/EXAMPLE-TEMPLATE.json`
