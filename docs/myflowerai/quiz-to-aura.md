# MyFlowerAI: Quiz-to-Aura Image Generation Flow

## Overview

The Quiz-to-Aura flow enables users to:
1. Complete a personality quiz
2. Receive a persona result
3. Generate a personalized "Strain Aura" abstract image

## User Flow

### 1. Quiz Completion
- User navigates to `/MyFlowerAI/quiz`
- Completes personality questions
- Receives persona result card with traits and recommended strain tags

### 2. Aura Generation Options

User can choose between two modes:

**A) Persona-Only Mode**
- Generates image based purely on quiz persona
- Uses persona's `image_style_keywords` and trait tags
- No specific strain required

**B) Persona + Strain Mode**
- User selects a specific strain from the database
- Combines persona style with strain meaning tags (effects, aromas)
- Creates a hybrid visual representation

### 3. Customization Options

Users can further customize their aura with:

**Vibe Sliders** (0-10 scale):
- **Intensity**: Subtle/gentle (0-3) → Bold/vivid (7-10)
- **Neon**: No glow (0) → Full neon (10)
- **Nature**: Geometric (0-3) → Organic (7-10)
- **Surreal**: Structured (0-3) → Dreamlike (7-10)
- **Chaos**: Calm (0-3) → Chaotic (7-10)

**Vibe Text** (optional, max 200 chars):
- Short freeform description
- Automatically scrubbed for safety (see `/docs/myflowerai/safety.md`)
- Blocked text replaced with neutral fallback

**Presets** (optional):
- Pre-configured style + vibe combinations
- Examples: "Neon Dreams", "Forest Mystic", "Cosmic Journey"

### 4. Image Generation

The system:
1. Validates all inputs (safety scrubbing for text)
2. Composes a DALL-E prompt using:
   - Persona image style keywords
   - Strain meaning tags (if selected)
   - Vibe slider settings
   - Sanitized user text
   - Art-only constraints
3. Calls OpenAI DALL-E 3 API
4. Stores generated image in Vercel Blob Storage (private)
5. Records metadata in database (persona_id, strain_id, storage_key, month)

### 5. Gallery View

Users can:
- View all their generated aura images
- See associated persona and strain (if used)
- Download or share images
- Generate variations

## Privacy & Data Storage

### Public Data (Committed to Git)
- Quiz definitions (`/data/myflowerai/quizzes/`)
- Persona packs (`/data/myflowerai/personas/`)
- Strain database (`/data/myflowerai/strains/`)
- Image presets (`/data/myflowerai/image-presets.json`)

**Important**: Public strain JSON files must NOT contain:
- Purchase dates
- Exact store locations
- `retrieved_at` timestamps
- `created_at`/`updated_at` timestamps
- Any personally identifying information

### Private Data (Database Only)

**Table: `myflowerai_quiz_results`**
```sql
id              UUID PRIMARY KEY
user_id         UUID (references User)
quiz_id         VARCHAR(100)
persona_id      VARCHAR(100)
created_month   VARCHAR(7)  -- YYYY-MM only (privacy-safe)
created_at      TIMESTAMP
```

**Table: `myflowerai_images`**
```sql
id              UUID PRIMARY KEY
user_id         UUID (references User)
persona_id      VARCHAR(100)
strain_id       VARCHAR(255) NULLABLE
preset_id       VARCHAR(100) NULLABLE
storage_key     TEXT  -- Vercel Blob pathname (not signed URL)
created_month   VARCHAR(7)  -- YYYY-MM only
created_at      TIMESTAMP
```

**Notes**:
- Raw quiz answers are NOT stored (only resulting persona_id)
- Timestamps use month-level granularity for privacy
- Images stored in Vercel Blob with user-scoped paths
- Storage keys are pathnames, not signed URLs (avoids committing temporary URLs)

## API Endpoints

### POST /api/myflowerai/quiz/submit

**Request**:
```json
{
  "quiz_id": "strain-personality-v1",
  "responses": {
    "q1_time_of_day": "evening",
    "q2_activity": "creative_work"
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "persona_id": "creative-fire",
    "persona_name": "Creative Fire",
    "vibe_summary": "Art, music, writing...",
    "recommended_tags": ["creative", "inspiring", "focused"],
    "trait_scores": {
      "creative": 0.85,
      "uplifting": 0.65
    }
  }
}
```

### POST /api/myflowerai/image/aura

**Request**:
```json
{
  "persona_id": "creative-fire",
  "strain_id": "southern-pound-cake",  // optional
  "preset_id": "neon-dreams",          // optional
  "vibe_settings": {                   // optional
    "intensity": 7,
    "neon": 8,
    "nature": 5,
    "surreal": 6,
    "chaos": 4
  },
  "user_vibe_text": "electric sunset vibes"  // optional
}
```

**Response**:
```json
{
  "success": true,
  "image_storage_key": "myflowerai/aura/user-id/1234567890.png",
  "image_url": "https://blob.vercel-storage.com/...",
  "title": "Southern Pound Cake (Indica) - Creative Fire Vibe",
  "prompt_metadata_safe": {
    "persona_id": "creative-fire",
    "strain_id": "southern-pound-cake",
    "preset_id": "neon-dreams"
  }
}
```

## Safety Constraints

All generated images must be:
- **Abstract/psychedelic art only** (no photorealism)
- No people, faces, or body parts
- No minors
- No weapons or violence
- No hate symbols
- No illegal activities
- No brand logos or packaging
- No medical claims
- No realistic cannabis plants/leaves

See `/docs/myflowerai/safety.md` for complete safety specifications.

## Age Gate

Cannabis-themed features require age verification:
- Simple modal/checkbox: "I confirm I am 18 years of age or older"
- Stored in:
  - Local storage (client-side, lightweight)
  - OR user profile setting (database, persistent)
- Not a legal age verification system
- UI-level check only

## Technical Notes

### Prompt Composition Strategy

The prompt composer (`/lib/myflowerai/image/promptComposer.ts`) deterministically builds prompts from:

1. **Base constraint**: "Abstract psychedelic art:"
2. **Preset style** (if provided): Takes precedence for style direction
3. **Strain type influence**: 
   - Sativa → "energetic upward flowing patterns"
   - Indica → "deep relaxing waves and soft gradients"
   - Hybrid → "balanced harmonious composition"
4. **Aroma/flavor visuals**: Maps tags to abstract forms (e.g., "citrus" → "bright yellow-orange swirls")
5. **Effect-based mood**: Maps effects to visual moods (e.g., "uplifting" → "ascending spirals")
6. **Persona style** (if no preset): Uses `image_style_keywords`
7. **Vibe settings**: Converts sliders to descriptive text
8. **User vibe text**: Sanitized and appended
9. **Mandatory suffix**: Art-only constraints (no text, no faces, etc.)

### Determinism & Variation

- Same persona + strain → similar style keywords
- Variation comes from:
  - DALL-E's random seed (server-side)
  - User's vibe sliders
  - User's vibe text
  - Selected preset

### Strain Meaning Tags

If strain JSON doesn't have `meaning` field, system derives it from:
- Strain type (sativa/indica/hybrid)
- Top terpenes (myrcene → relaxing, limonene → uplifting, etc.)
- THC/CBD ratio

See `/lib/myflowerai/strain/meaning.ts` for tag derivation logic.

## Testing Checklist

- [ ] Quiz completion stores result in database
- [ ] Persona-only mode generates valid image
- [ ] Persona + strain mode generates valid image
- [ ] Safety scrubber blocks disallowed text
- [ ] Prompt composer includes art-only constraints
- [ ] Generated images appear in user gallery
- [ ] No private data in public strain JSON
- [ ] Age gate appears and persists verification

## Future Enhancements

- **Image-to-image generation**: Upload reference image for style transfer
- **Variation generation**: Create variations of existing aura images
- **Animation**: Animated/looping versions of auras
- **Social sharing**: Privacy-safe sharing with watermarks
- **Print-ready exports**: High-resolution downloads
- **NFT minting**: Optional blockchain storage (with user consent)
