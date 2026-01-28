# MyFlowerAI: Safety Constraints & Content Filtering

## Overview

MyFlowerAI implements strict safety controls to ensure:
- Legal compliance (no illegal sales, minors, etc.)
- Platform safety (no harmful content)
- Product safety (abstract art only, no medical claims)
- Privacy safety (no personally identifying information)

## Safety Layers

### 1. User Input Validation (Vibe Text)

User-provided "vibe text" goes through automatic safety scrubbing before being used in image generation prompts.

**Implementation**: `/lib/myflowerai/image/safety.ts`

#### Blocked Content Categories

**Illegal Sale/Distribution**
- Keywords: sell, selling, buy, buying, purchase, deal, dealer, supplier, supply, distribute, distribution
- Phrases: "for sale", "on sale", "wholesale", "bulk order", "shipping", "delivery", "mail order"
- **Reason**: Prohibits any reference to commercial cannabis transactions

**Hard Drugs (Non-Cannabis)**
- Keywords: cocaine, heroin, meth, methamphetamine, fentanyl, crack, ecstasy, mdma, lsd, pcp, ketamine, opioid
- **Reason**: Cannabis-only focus; no references to other controlled substances

**Minors & Age-Inappropriate Content**
- Keywords: kid, kids, child, children, minor, minors, teen, teens, teenager, school, student, underage
- Phrases: "high school", "middle school", "elementary"
- **Reason**: Cannabis is adult-only (18+); no content involving or targeting minors

**Weapons & Violence**
- Keywords: gun, guns, weapon, weapons, firearm, rifle, pistol, shoot, shooting, violence, violent, attack, assault
- **Reason**: Maintains peaceful, artistic focus; prevents harmful associations

**Hate Speech & Discrimination**
- Keywords: hate, racist, racism, nazi, supremacist, terrorist
- **Reason**: Zero tolerance for discriminatory or extremist content

**Medical Claims**
- Keywords: cure, cures, treat, treatment, medicine, medication, prescription, diagnose, diagnosis, therapy, therapeutic
- Phrases: "pain relief", "anxiety relief", "depression treatment", "ptsd", "cancer", "epilepsy", "seizure"
- **Reason**: Cannot make medical claims; informational tags only (e.g., "commonly associated with relaxation")

#### Safety Scrubber Behavior

```typescript
function scrubVibeText(vibeText: string): string {
  if (containsBlockedContent(vibeText)) {
    console.warn("Blocked content detected (not logged for privacy)");
    return NEUTRAL_FALLBACK_TEXT;
  }
  return vibeText.trim().substring(0, 200); // Max 200 chars
}
```

**Neutral Fallback**: `"peaceful abstract art with natural flowing patterns"`

#### Validation Response

```typescript
{
  isValid: boolean,
  reason?: string,  // If invalid, explains why
  sanitized: string // Either cleaned text or fallback
}
```

**User Experience**:
- If text is blocked, API returns 400 error with reason
- Frontend can show: "Your text contains prohibited content. Using neutral vibe instead."
- User can modify text and retry

### 2. Prompt Composition Constraints

All generated image prompts include mandatory "art-only" constraints appended to the end.

**Implementation**: `/lib/myflowerai/image/promptComposer.ts`

#### Mandatory Constraints

```typescript
const constraints = [
  "No text, no labels, no branding",
  "No people, no faces, no body parts",
  "No product packaging, no bottles, no containers",
  "No realistic cannabis plants or leaves",
  "Pure abstract art only",
];
```

**Prompt Structure**:
```
Abstract psychedelic art: [persona style] [strain influences] [vibe settings] [user text]. No text, no labels, no branding. No people, no faces, no body parts. No product packaging, no bottles, no containers. No realistic cannabis plants or leaves. Pure abstract art only.
```

#### Prompt Validation

The system validates composed prompts before sending to DALL-E:

```typescript
function validatePrompt(prompt: string): {
  isValid: boolean,
  issues: string[]
}
```

**Forbidden Patterns**:
- Person/people references: `\b(person|people|face|man|woman|child|kid)\b`
- Product packaging: `\b(bottle|package|container|box|jar|bag)\b`
- Realistic plants: `\b(cannabis|marijuana|weed|pot|bud|flower)\s+(plant|leaf|leaves)\b`
- Branding: `\b(brand|logo|trademark|company)\b`
- Medical claims: `\b(cure|treat|medicine|medical|prescription)\b`

**If validation fails**: Prompt is rejected before API call; error logged; user notified.

### 3. DALL-E Content Policy

OpenAI's DALL-E 3 has built-in content filtering:
- Refuses to generate harmful content
- Blocks copyrighted material
- Prevents realistic faces
- Filters violence and explicit content

**Our prompts are designed to align with DALL-E policies.**

**If DALL-E rejects a prompt**:
- Status: 400 (content_policy_violation)
- User sees: "Image generation failed due to content policy"
- Logs capture rejection for review

### 4. Age Gate

Simple age verification before accessing cannabis-themed features.

**Implementation**: UI-level modal/checkbox

**Flow**:
1. User attempts to access `/MyFlowerAI/quiz` or image generation
2. If not verified, show modal: "I confirm I am 18 years of age or older"
3. Store verification in:
   - Local storage (key: `myflowerai_age_verified`)
   - OR user profile (database field: `age_verified_myflowerai`)
4. Check persists across sessions

**Important Notes**:
- **NOT a legal age verification system**
- UI-level check only (honor system)
- Does not verify identity or date of birth
- For informational/awareness purposes

### 5. Data Privacy Safeguards

**Public Data** (committed to git):
- Quiz definitions
- Persona packs
- Strain database (sanitized)
- Image presets

**What CANNOT be in public data**:
- User quiz answers
- User-generated images
- Purchase dates
- Exact store locations
- `retrieved_at` timestamps
- `created_at`/`updated_at` timestamps
- Personally identifying information

**Private Data** (database only):
- Quiz results: user_id, persona_id, month (not full timestamp)
- Generated images: user_id, storage_key, month
- No raw quiz answers stored

**Image Storage**:
- Vercel Blob Storage (user-scoped paths)
- Storage keys only (not signed URLs)
- Private per user (can implement RLS if needed)

## Testing Safety Controls

### Unit Tests

**Safety Scrubber** (`/tests/unit/myflowerai/image-safety.test.ts`):
- ✅ Blocks "selling weed"
- ✅ Blocks "for kids"
- ✅ Blocks "pain relief"
- ✅ Blocks "gun"
- ✅ Allows "peaceful sunset"
- ✅ Max length enforcement

**Prompt Composer** (`/tests/unit/myflowerai/image-prompt.test.ts`):
- ✅ Always includes art-only constraints
- ✅ Validates composed prompts
- ✅ Rejects prompts with forbidden patterns
- ✅ Handles persona-only mode
- ✅ Handles persona + strain mode

### Integration Tests

**API Routes**:
- ✅ POST /api/myflowerai/quiz/submit rejects invalid responses
- ✅ POST /api/myflowerai/image/aura blocks unsafe vibe text
- ✅ API returns appropriate error messages

### Manual Testing Checklist

- [ ] Try submitting blocked vibe text → sees error with reason
- [ ] Generated image is abstract (no faces, no packaging)
- [ ] Age gate appears on first visit
- [ ] Age verification persists across sessions
- [ ] Quiz result page shows persona, not raw answers
- [ ] Gallery shows only user's own images
- [ ] No private data in public strain JSON files

## Reporting Issues

If unsafe content bypasses filters:
1. **Do not share the content publicly**
2. Log the issue with minimal details (no reproduction of harmful content)
3. Update safety patterns in `/lib/myflowerai/image/safety.ts`
4. Add test case to prevent regression
5. Document fix in changelog

## Future Enhancements

### Advanced Filtering
- **ML-based content moderation**: Use OpenAI Moderation API for additional layer
- **Context-aware blocking**: Allow "kids" in "goat kids" but block in "for kids"
- **Multi-language support**: Detect blocked content in other languages

### User Reporting
- "Report image" button in gallery
- Admin review queue for flagged content
- Automatic takedown for verified violations

### Compliance Tracking
- Audit log for all safety rejections
- Monthly reports on blocked content patterns
- User education on community guidelines

## Legal Disclaimer

**MyFlowerAI is informational only**:
- Not medical advice
- Not a recommendation to use cannabis
- Not legal advice on cannabis laws
- Users responsible for compliance with local laws
- Must be 18+ to use cannabis-themed features (common legal age)

**Cannabis laws vary by jurisdiction**:
- Some states/countries prohibit cannabis entirely
- Some allow medical use only
- Some allow recreational use
- Age requirements vary (typically 18-21+)

**By using MyFlowerAI, users acknowledge**:
- They are of legal age in their jurisdiction
- They understand cannabis laws in their area
- They will not use the service for illegal purposes
- Generated content is for personal, artistic use only
