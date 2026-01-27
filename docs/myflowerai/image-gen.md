# MyFlowerAI Image Generation

## Overview

The MyFlowerAI Image Generation feature creates abstract psychedelic art inspired by cannabis strain profiles. The system uses strain terpene profiles, effect tags, and aroma/flavor characteristics to compose prompts that generate unique artistic visualizations.

## Key Principles

### Art-Only Approach

All generated images are **abstract psychedelic art only**. The system enforces strict constraints to ensure compliance with legal and platform requirements:

1. **Abstract/Psychedelic Only**: All images are non-representational art
2. **No Medical Claims**: No therapeutic or medical suggestions
3. **No Branding**: No logos, trademarks, or brand names
4. **No Minors**: No children or age-inappropriate content
5. **No Illegal Activities**: No references to illegal sale, distribution, or use
6. **No Real Persons**: No recognizable faces or people
7. **No Photoreal Packaging**: No realistic product containers, bottles, or packaging
8. **No Realistic Plants**: No photorealistic cannabis plants or leaves

## Architecture

### Components

#### 1. Prompt Composer (`/lib/myflowerai/image/prompt-composer.ts`)

Composes safe, art-focused prompts for image generation.

**Inputs:**
- **Strain Data**: Terpene profile, effect tags, aroma/flavor tags, strain type
- **Persona Profile** (optional): User's preferred aesthetic style
- **Vibe Settings** (optional): Intensity, neon, nature, surreal, chaos sliders (0-10)
- **User Vibe Text** (optional): Short custom text (sanitized)

**Output:**
- Composed prompt string with mandatory art-only constraints

**Example Flow:**
```typescript
const prompt = composeImagePrompt(
  strainData,        // Contains meaning tags from tagger
  personaProfile,    // Optional: "Neon Arcade Brain" persona
  {                  // Optional vibe settings
    intensity: 7,
    neon: 8,
    nature: 3,
    surreal: 9,
    chaos: 6
  },
  "cosmic space vibes" // Optional user text
);
```

**Example Output:**
```
Abstract psychedelic art: energetic upward flowing patterns. bright yellow-orange swirls, soft pink and purple gradients, emerald green fractals. ascending spirals, radiating bursts of light, imaginative abstract shapes. neon glowing colors, geometric abstract shapes, dreamlike surrealism, harmonious balance. cosmic space vibes. No text, no labels, no branding. No people, no faces, no body parts. No product packaging, no bottles, no containers. No realistic cannabis plants or leaves. Pure abstract art only.
```

#### 2. Safety Scrubber (`/lib/myflowerai/image/safety.ts`)

Filters user-provided vibe text for prohibited content.

**Blocked Content:**
- Illegal sale/distribution language
- Hard drugs (non-cannabis)
- Minors and age-inappropriate content
- Weapons and violence
- Hate speech and discrimination
- Medical claims

**Behavior:**
- If blocked content detected → Returns neutral fallback text
- Otherwise → Returns sanitized text (trimmed, length-limited to 200 chars)

**Example:**
```typescript
// Safe input
scrubVibeText("cosmic underwater dreams"); 
// → "cosmic underwater dreams"

// Blocked input
scrubVibeText("for sale to kids with medicine"); 
// → "peaceful abstract art with natural flowing patterns" (fallback)
```

#### 3. API Route (`/app/api/myflowerai/generate-image/route.ts`)

REST endpoint for image generation.

**Endpoint:** `POST /api/myflowerai/generate-image`

**Request Body:**
```json
{
  "strain_id": "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
  "persona_id": "neon-arcade-brain",
  "vibe_settings": {
    "intensity": 7,
    "neon": 8,
    "nature": 3,
    "surreal": 9,
    "chaos": 6
  },
  "user_vibe_text": "cosmic space vibes"
}
```

**Response (Success):**
```json
{
  "success": true,
  "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "title": "Juicy Jane (hybrid) - Neon Arcade Brain Vibe",
  "prompt_used": "Abstract psychedelic art: ...",
  "strain": {
    "id": "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
    "name": "Juicy Jane",
    "type": "hybrid"
  },
  "persona": {
    "id": "neon-arcade-brain",
    "name": "Neon Arcade Brain"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid vibe text",
  "reason": "Text contains prohibited content. Please avoid references to illegal activities, weapons, minors, or medical claims."
}
```

#### 4. UI Page (`/app/(chat)/MyFlowerAI/image-gen/page.tsx`)

User interface for image generation.

**Features:**
- Strain selector dropdown
- Persona selector (optional)
- Five vibe sliders:
  - **Intensity**: Subtle (0) → Vivid (10)
  - **Neon Glow**: None (0) → Maximum (10)
  - **Nature**: Geometric (0) → Organic (10)
  - **Surreal**: Structured (0) → Dreamlike (10)
  - **Energy**: Calm (0) → Chaotic (10)
- Optional text input for additional vibe
- Generate button
- Image display with title
- Safety notice

## Usage Examples

### Example 1: Simple Strain-Based Generation

```typescript
// Minimal request - just strain
const response = await fetch("/api/myflowerai/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    strain_id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g"
  })
});
```

**Result:** Abstract art based on Juicy Jane's citrus/floral terpenes and uplifting effects.

### Example 2: With Persona Style

```typescript
// Add persona for style guidance
const response = await fetch("/api/myflowerai/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    strain_id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g",
    persona_id: "forest-wanderer"
  })
});
```

**Result:** Same strain, but with earthy, natural aesthetic from "Forest Wanderer" persona.

### Example 3: Full Customization

```typescript
// All parameters
const response = await fetch("/api/myflowerai/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    strain_id: "planet-13-margalope-tier-3-3p5g",
    persona_id: "neon-arcade-brain",
    vibe_settings: {
      intensity: 9,
      neon: 10,
      nature: 2,
      surreal: 8,
      chaos: 7
    },
    user_vibe_text: "electric digital cityscape at midnight"
  })
});
```

**Result:** Highly vivid, neon-saturated, geometric, surreal art with chaotic energy and digital themes.

## Prompt Composition Strategy

### 1. Base Art Style
Always starts with: "Abstract psychedelic art:"

### 2. Strain Type Influence
- **Sativa**: "energetic upward flowing patterns"
- **Indica**: "deep relaxing waves and soft gradients"
- **Hybrid**: "balanced harmonious composition"

### 3. Aroma/Flavor Visual Mapping
Maps aroma tags to visual concepts:
- `citrus` → "bright yellow-orange swirls"
- `pine` → "deep green flowing lines"
- `floral` → "soft pink and purple gradients"
- `earthy` → "rich brown textures"
- `spicy` → "warm red angular patterns"

### 4. Effect Mood Mapping
Maps effect tags to visual moods:
- `uplifting` → "ascending spirals"
- `energizing` → "radiating bursts of light"
- `relaxing` → "gentle flowing waves"
- `calming` → "soft rippling water-like patterns"
- `creative` → "imaginative abstract shapes"

### 5. Persona Style Keywords
Adds persona-specific aesthetic guidance:
- "Neon Arcade Brain" → "neon glowing colors", "geometric shapes"
- "Forest Wanderer" → "earthy tones", "organic forms"

### 6. Vibe Settings Translation
Converts slider values to descriptive text:
- Intensity 0-3 → "subtle and gentle"
- Intensity 7-10 → "bold and vivid"
- Neon 7-10 → "neon glowing colors"
- etc.

### 7. User Vibe Text (Sanitized)
Adds user's custom text after safety filtering.

### 8. Mandatory Constraints (Always Appended)
```
No text, no labels, no branding. No people, no faces, no body parts. 
No product packaging, no bottles, no containers. 
No realistic cannabis plants or leaves. Pure abstract art only.
```

## Safety Mechanisms

### Input Validation

1. **Strain ID Validation**
   - Must reference existing strain file
   - Returns 404 if not found

2. **Persona ID Validation**
   - Optional field
   - Continues without persona if not found (logs warning)

3. **Vibe Text Filtering**
   - Checks against blocked content patterns
   - Returns 400 error if blocked content detected
   - Provides reason in error response

### Content Filtering Patterns

**Illegal Activities:**
- `sell`, `buy`, `dealer`, `distribute`, `for sale`, `shipping`, `delivery`

**Hard Drugs:**
- `cocaine`, `heroin`, `meth`, `fentanyl`, `crack`, `ecstasy`, `mdma`, `lsd`, `pcp`

**Minors:**
- `kid`, `child`, `minor`, `teen`, `teenager`, `school`, `underage`

**Weapons:**
- `gun`, `weapon`, `firearm`, `rifle`, `pistol`, `shoot`, `violence`, `assault`

**Hate Speech:**
- `hate`, `racist`, `nazi`, `supremacist`, `terrorist`

**Medical Claims:**
- `cure`, `treat`, `medicine`, `prescription`, `diagnose`, `therapy`
- `pain relief`, `anxiety relief`, `depression treatment`, `ptsd`, `cancer`

### Prompt Validation

After composition, prompts are validated to ensure no forbidden content:
- No references to people or faces
- No product packaging or containers
- No realistic plants or leaves
- No branding or logos
- No medical terminology

## Integration with Strain Data

### Required Strain Fields

The image generation system requires strains to have a `meaning` section (generated by tagger):

```json
{
  "strain": {
    "name": "Juicy Jane",
    "type": "hybrid"
  },
  "meaning": {
    "aroma_flavor_tags": ["citrus", "floral", "sweet"],
    "effect_tags": ["uplifting", "creative", "mood-enhancing"],
    "dominant_terpenes": ["limonene", "caryophyllene", "linalool"]
  }
}
```

### Terpene to Visual Mapping

The system uses the existing `terpene-cannabinoid-map.json` for effect and aroma tags, then maps those to visual concepts in the prompt composer.

## API Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-...  # Required for DALL-E 3 API
```

### Image Generation Settings

Currently hardcoded in API route (can be made configurable):
- **Model**: `dall-e-3`
- **Size**: `1024x1024`
- **Quality**: `standard`
- **Response Format**: `url`

## Error Handling

### API Errors

| Error | Status | Reason |
|-------|--------|--------|
| `strain_id is required` | 400 | Missing required field |
| `Strain not found: {id}` | 404 | Invalid strain ID |
| `Invalid vibe text` | 400 | Blocked content detected |
| `OpenAI API key not configured` | 500 | Missing env var |
| `Image generation failed` | 502 | OpenAI API error |

### UI Error Display

All errors are displayed in an alert component with user-friendly messages.

## Testing

### Manual Testing Checklist

- [ ] Generate image with just strain
- [ ] Generate image with strain + persona
- [ ] Generate image with all vibe sliders
- [ ] Generate image with custom vibe text
- [ ] Test blocked content detection (try "for sale to kids")
- [ ] Test strain not found error
- [ ] Test with different strain types (sativa, indica, hybrid)
- [ ] Verify generated images contain no prohibited content

### Example Test Cases

1. **Basic Generation:**
   - Strain: "Juicy Jane"
   - Expected: Citrus/floral colored abstract art

2. **Persona Influence:**
   - Strain: "Juicy Jane"
   - Persona: "Neon Arcade Brain"
   - Expected: Same strain but with neon/geometric style

3. **Safety Filter:**
   - Vibe Text: "for sale in my shop"
   - Expected: Error message about prohibited content

4. **Custom Vibe:**
   - Vibe Text: "underwater ocean dreams"
   - Expected: Aquatic-themed abstract art

## Future Enhancements

### Potential Improvements

1. **Image History**
   - Save generated images to user's gallery
   - Allow re-generating with same settings

2. **Style Presets**
   - Pre-configured vibe setting combinations
   - "Cosmic", "Organic", "Neon", "Minimal" presets

3. **Batch Generation**
   - Generate multiple variations at once
   - Compare different persona styles

4. **Higher Quality**
   - Option for `hd` quality (slower, more expensive)
   - Larger sizes (1792x1024, 1024x1792)

5. **Image Editing**
   - Use DALL-E edit/variation endpoints
   - Allow users to refine generated images

6. **Sharing**
   - Social media sharing
   - Download in multiple formats

## Compliance Notes

### Legal Requirements

This system is designed for **entertainment and artistic purposes only**:
- No medical advice or claims
- No facilitation of illegal activities
- No age-inappropriate content
- No realistic product imagery that could be used for packaging

### Platform Safety

All generated content is abstract art that:
- Cannot be mistaken for medical information
- Cannot be used for illegal product advertising
- Contains no recognizable people or brands
- Is appropriate for all adult audiences

### User Acknowledgment

The UI displays a safety notice:
> "This tool generates abstract psychedelic art inspired by cannabis strain profiles. All generated images are purely artistic interpretations with no medical claims or advice."

## Support

For issues or questions:
- Check error messages in browser console
- Verify `OPENAI_API_KEY` is set correctly
- Ensure strain files have `meaning` section (run tagger)
- Review this documentation for constraints and usage

---

**Last Updated:** 2026-01-27
**Version:** 1.0.0
