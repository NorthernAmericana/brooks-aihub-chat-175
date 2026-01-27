# MyFlowerAI Quiz System

## Quick Start

### For Users

Access the quiz by:
1. Navigate to `/MyFlowerAI/quiz` directly, or
2. Chat with MyFlowerAI and type: `/MyFlowerAI/ Let's do a quiz`

The quiz helps you discover your cannabis personality and get personalized strain recommendations.

### For Developers

#### Files Structure

```
lib/myflowerai/quiz/
├── engine.ts          # Quiz loading and processing
├── scorer.ts          # Response scoring and validation
├── mapper.ts          # Trait-to-tag conversion
└── types.ts           # TypeScript definitions

data/myflowerai/quizzes/
└── strain-personality-v1.json   # Quiz definition

app/(chat)/MyFlowerAI/quiz/
└── page.tsx           # Quiz UI route

components/myflowerai/quiz/
├── multiple-choice-question.tsx
├── slider-question.tsx
├── persona-card.tsx
├── strain-recommendations.tsx
└── quiz-progress.tsx

tests/unit/myflowerai/
├── scorer.test.ts
└── mapper.test.ts
```

#### Running Tests

```bash
npx tsx tests/unit/myflowerai/scorer.test.ts
npx tsx tests/unit/myflowerai/mapper.test.ts
```

## Features

- **Privacy-First**: No PII stored in quiz data or results
- **Deterministic**: Same answers always produce same results
- **Versioned**: Quizzes can evolve over time
- **Tag-Based Matching**: Strains matched via tag overlap
- **Educational**: Prominent disclaimers, NOT medical advice

## Creating New Quizzes

See `/docs/myflowerai/quizzes.md` for complete documentation on creating new quizzes.

## Safety & Compliance

- All quizzes include mandatory disclaimers
- Results are educational and informational only
- NOT medical advice or diagnosis
- Encourages "start low, go slow" approach
- Links to professional resources

## Technical Details

### Scoring Flow

1. User answers questions
2. Responses converted to trait points
3. Trait scores normalized to 0-1 range
4. Profile matched based on normalized scores
5. Traits mapped to strain tags
6. Strains ranked by tag overlap

### Trait System

Current traits:
- uplifting
- relaxing
- creative
- social
- cozy
- active
- focused
- adventurous

### Profile System

Current profiles:
- The Energetic Explorer
- The Creative Thinker
- The Social Butterfly
- The Cozy Relaxer
- The Focused Achiever
- The Balanced Explorer (default)

## Future Enhancements

- Multiple quiz types (quick 3-question vs deep 15-question)
- Terpene-specific quizzes
- Effect-based quizzes
- Time-of-day recommendations
- Multi-language support
- Anonymous result sharing

## Support

For questions or issues, see `/docs/myflowerai/quizzes.md` or contact the development team.
