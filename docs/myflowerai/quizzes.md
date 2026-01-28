# MyFlowerAI Quiz System

## Overview

The MyFlowerAI Quiz System is a personality-based recommendation engine that helps users discover cannabis strains matching their preferences, lifestyle, and desired experiences. The system uses a trait-based scoring model to map user responses to strain characteristics.

## Design Principles

1. **Privacy-First**: No personally identifying information is stored in quiz data or results
2. **Educational**: Provides informational recommendations, NOT medical advice
3. **Deterministic**: Same responses always produce the same results
4. **Versioned**: Quizzes are versioned for evolution over time
5. **Flexible**: Supports multiple quiz types and scoring models

## Architecture

### Components

1. **Quiz Engine** (`/lib/myflowerai/quiz/engine.ts`)
   - Loads quiz definitions
   - Orchestrates scoring and result generation
   - Manages quiz lifecycle

2. **Scorer** (`/lib/myflowerai/quiz/scorer.ts`)
   - Calculates trait scores from responses
   - Normalizes scores to 0-1 range
   - Validates responses
   - Matches result profiles

3. **Mapper** (`/lib/myflowerai/quiz/mapper.ts`)
   - Maps trait scores to strain tags
   - Calculates strain match scores
   - Provides tag-based recommendations

4. **Types** (`/lib/myflowerai/quiz/types.ts`)
   - TypeScript type definitions
   - Ensures type safety across the system

### Data Flow

```
User Responses → Scorer → Trait Vector → Mapper → Tags → Strain Recommendations
                                ↓
                          Result Profile
```

## Quiz Format

### Quiz Definition Structure

```typescript
{
  id: string;              // Unique quiz ID
  version: string;         // Version (e.g., "1.0")
  title: string;           // Display title
  description: string;     // Quiz description
  questions: Question[];   // Array of questions
  scoring: ScoringRules;   // Scoring configuration
  result_profiles: Profile[]; // Possible result personas
  disclaimers: string[];   // Safety and legal disclaimers
}
```

### Question Types

#### Multiple-Choice Questions

```json
{
  "id": "q1_activity",
  "text": "What's your ideal cannabis activity?",
  "type": "multiple-choice",
  "required": true,
  "options": [
    {
      "id": "creative_work",
      "text": "Creative projects",
      "trait_points": {
        "creative": 4,
        "focused": 2
      }
    }
  ]
}
```

Each answer option contributes points to one or more traits. Points can be positive (increases trait) or negative (decreases trait).

#### Slider Questions

```json
{
  "id": "q6_energy",
  "text": "Rate your ideal energy level (1-10)",
  "type": "slider",
  "required": true,
  "slider_config": {
    "min": 1,
    "max": 10,
    "step": 1,
    "labels": {
      "min": "Relaxed",
      "max": "Energized"
    },
    "trait_mapping": [
      {
        "trait": "uplifting",
        "scale": "linear"
      }
    ]
  }
}
```

Slider values are converted to trait points using linear or exponential scaling.

### Scoring System

#### Trait Vector

The scoring system tracks multiple traits (e.g., "uplifting", "relaxing", "creative", "social", "cozy", "active", "focused", "adventurous").

Each quiz response contributes points to these traits, building a trait vector:

```typescript
{
  uplifting: 12,
  relaxing: 5,
  creative: 8,
  social: 15,
  // ...
}
```

#### Normalization

Raw trait scores are normalized to 0-1 range based on defined trait ranges:

```json
{
  "trait_ranges": {
    "uplifting": { "min": -5, "max": 20 },
    "relaxing": { "min": -5, "max": 25 }
  }
}
```

This ensures fair comparison across traits with different score ranges.

#### Profile Matching

Normalized scores are matched to result profiles using condition thresholds:

```json
{
  "profile_mapping": [
    {
      "conditions": {
        "uplifting": { "min": 0.6 },
        "active": { "min": 0.5 }
      },
      "profile_id": "energetic_explorer"
    }
  ]
}
```

The first profile where ALL conditions are met is selected.

### Result Profiles

Each profile represents a "persona" with:

```typescript
{
  id: string;                    // Unique profile ID
  name: string;                  // Display name (e.g., "The Creative Thinker")
  vibe_text: string;             // Personality description
  trait_scores: Record<string, number>; // User's actual scores (filled at runtime)
  recommended_tags: string[];    // Strain tags to match
  avoid_tags?: string[];         // Tags to avoid
}
```

### Trait-to-Tag Mapping

The mapper converts trait scores to strain tags using threshold-based rules:

```typescript
{
  trait: "uplifting",
  mappings: [
    { threshold: 0.7, tags: ["energizing", "uplifting", "mood-enhancing"] },
    { threshold: 0.4, tags: ["uplifting", "mood-enhancing"] }
  ]
}
```

Higher trait scores unlock more specific tag combinations.

## Strain Recommendations

### Tag Matching

Strains are scored based on tag overlap with the user's recommended tags:

```typescript
match_score = (matching_tags.length / recommended_tags.length)
```

Strains with any "avoid_tags" receive a score of 0.

### Results

Top 10 matching strains are returned with:
- Strain name and brand
- Match score (0-1)
- List of matching tags

## Privacy & Safety

### Privacy

**NEVER store these in public quiz or strain files:**
- User quiz responses
- User-specific results
- Personally identifying information
- User preferences or history

**Storage guidelines:**
- Quiz responses can be stored in private, per-user storage (e.g., Supabase, local encrypted)
- Results are ephemeral by default (generated on-demand)
- If persisted, store privately with proper access controls

### Safety Language

All quiz results include disclaimers:

```json
{
  "disclaimers": [
    "This quiz provides general informational recommendations only and is NOT medical advice.",
    "Cannabis effects vary by individual. What works for one person may not work for another.",
    "Always start with a low dose and go slow, especially with new strains.",
    "Consult a healthcare professional for medical advice about cannabis use.",
    "Tags and recommendations are based on general terpene profiles and user preferences, not clinical studies.",
    "This tool does not diagnose, treat, cure, or prevent any disease or medical condition."
  ]
}
```

**Display requirements:**
- Show disclaimers on quiz results page
- Include "NOT medical advice" warning prominently
- Encourage "start low, go slow" approach
- Link to professional resources for medical questions

## Usage Examples

### Loading and Taking a Quiz

```typescript
import { loadQuiz, processQuizResponses } from '@/lib/myflowerai/quiz/engine';

// Load quiz
const quiz = await loadQuiz('strain-personality-v1');

// User takes quiz
const responses = {
  q1_time_of_day: 'evening',
  q2_activity: 'creative_work',
  q3_mood_goal: 'creative_flow',
  // ...
};

// Process responses
const result = processQuizResponses(quiz, responses);

console.log(result.profile.name); // "The Creative Thinker"
console.log(result.profile.recommended_tags); // ["creative", "focus", ...]
```

### Getting Strain Recommendations

```typescript
import { generateStrainRecommendations } from '@/lib/myflowerai/quiz/engine';

// Load strain database (example)
const strains = [...]; // Array of strain objects with tags

// Generate recommendations
const resultWithStrains = generateStrainRecommendations(result, strains);

console.log(resultWithStrains.suggested_strains);
// [
//   { name: "Blue Dream", brand: "...", match_score: 0.85, matching_tags: [...] },
//   ...
// ]
```

## Creating New Quizzes

### Quiz Development Workflow

1. **Define traits**: Identify the personality/preference dimensions to measure
2. **Write questions**: Create questions that effectively differentiate between traits
3. **Assign points**: Map each answer to trait points (iterate based on testing)
4. **Define profiles**: Create result personas that represent common trait combinations
5. **Set thresholds**: Configure profile matching conditions
6. **Add disclaimers**: Include appropriate safety and legal language
7. **Test**: Validate with sample responses

### Quiz File Location

Place quiz JSON files in: `/data/myflowerai/quizzes/`

**Naming convention:** `{quiz-name}-v{version}.json`

Examples:
- `strain-personality-v1.json`
- `terpene-preference-v1.json`
- `usage-pattern-v2.json`

### Versioning

When updating a quiz:

1. **Minor changes** (typo fixes, description updates): Increment version (1.0 → 1.1)
2. **Major changes** (new questions, different scoring): Create new version (v1 → v2)
3. Keep old versions available for historical data compatibility

## Testing

### Unit Tests

Create tests for:
1. **Scoring logic**: Verify trait points are calculated correctly
2. **Normalization**: Ensure scores are properly normalized to 0-1
3. **Profile matching**: Test condition evaluation
4. **Tag mapping**: Verify trait-to-tag conversion
5. **Validation**: Test input validation catches errors

### Test Example

```typescript
import { calculateRawTraitScores } from '@/lib/myflowerai/quiz/scorer';

test('calculates trait scores correctly', () => {
  const quiz = { /* quiz definition */ };
  const responses = { /* user responses */ };
  
  const scores = calculateRawTraitScores(quiz, responses);
  
  expect(scores.creative).toBe(8);
  expect(scores.social).toBe(4);
});
```

## UI Integration

### Route

Quiz UI is accessible at: `/MyFlowerAI/quiz`

### User Flow

1. **Quiz selection** (if multiple quizzes)
2. **Question progression** (one at a time or all at once)
3. **Response collection** (buttons for multiple-choice, slider for scale)
4. **Results display**:
   - Persona card with name and description
   - Trait radar chart (visual representation)
   - Recommended tags
   - Suggested strains with match scores

### UI Components

- `QuizList` - Display available quizzes
- `QuizQuestion` - Render individual questions
- `MultipleChoiceAnswer` - Button group for options
- `SliderAnswer` - Slider input with labels
- `QuizProgress` - Progress indicator
- `PersonaCard` - Display result profile
- `TraitRadar` - Visual trait representation
- `StrainRecommendations` - List of suggested strains

## Future Enhancements

### Potential Features

1. **Quiz variations**: Different quiz types (quick 3-question vs. deep 15-question)
2. **Hybrid scoring**: Combine multiple scoring models
3. **Dynamic questions**: Adaptive questions based on previous answers
4. **Terpene-specific quizzes**: Focus on aroma/flavor preferences
5. **Effect-based quizzes**: Target specific desired effects
6. **Time-of-day quizzes**: Morning vs. evening strain recommendations
7. **Multi-language support**: Internationalization
8. **Result sharing**: Anonymous result sharing (no PII)

### Data Science

- Analyze anonymized response patterns (if stored privately)
- Improve profile definitions based on user feedback
- Refine tag mappings using strain database analytics
- A/B test different question wordings

## Compliance & Legal

### Content Guidelines

**DO:**
- Provide general educational information
- Use disclaimers prominently
- Focus on strain characteristics (terpenes, effects)
- Encourage responsible use
- Link to professional resources

**DON'T:**
- Make medical claims or diagnoses
- Guarantee specific effects
- Encourage excessive use
- Target minors
- Store personally identifying data without consent

### Jurisdiction Considerations

Cannabis laws vary by location. Ensure:
- Age verification where required
- Compliance with local advertising laws
- Appropriate disclaimers for jurisdiction
- No prohibited health claims

## Support & Maintenance

### Updating Quizzes

When modifying quizzes:
1. Review impact on existing results
2. Consider creating new version vs. updating
3. Update documentation
4. Notify users of significant changes
5. Archive old versions if deprecated

### Monitoring

Track (with user consent):
- Quiz completion rates
- Question skip rates
- Profile distribution
- Strain recommendation click-through
- User feedback

Use insights to improve quiz quality and relevance.

## References

- **Terpene data**: `/data/myflowerai/terpene-cannabinoid-map.json`
- **Strain schema**: `/docs/myflowerai/schema.md`
- **Personal fit tracking**: `/docs/myflowerai/personal-fit.md`
- **Session logging**: `/docs/myflowerai/session-logging.md`

---

**Last Updated**: January 2026  
**Current Version**: 1.0  
**Quiz System Version**: 1.0
