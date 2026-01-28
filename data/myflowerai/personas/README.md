# MyFlowerAI Persona Packs

## Overview

This directory contains persona pack definitions for the MyFlowerAI quiz system. Persona packs provide rich, themed user archetypes that map to specific cannabis strain preferences and experiences.

## Structure

Each persona is stored as an individual JSON file with a standardized schema:

```json
{
  "persona_id": "unique-identifier",
  "display_name": "User-Facing Name",
  "vibe_summary": "Detailed description of the persona...",
  "tag_profile": {
    "primary_tags": ["list", "of", "main", "tags"],
    "secondary_tags": ["list", "of", "supporting", "tags"],
    "avoid_tags": ["tags", "to", "avoid"]
  },
  "image_style_keywords": [
    "visual", "style", "keywords", "for", "AI", "image", "generation"
  ]
}
```

## Available Personas

### Energy & Activity Level

1. **Golden Hour Optimist** (`golden-hour-optimist.json`)
   - Uplifting, mood-enhancing, energizing vibes
   - Perfect for: Morning coffee, sunset appreciation, positive transitions

2. **Adventure Seeker** (`adventure-seeker.json`)
   - High energy, exploration, euphoric experiences
   - Perfect for: Road trips, festivals, outdoor activities

3. **Forest Wanderer** (`forest-wanderer.json`)
   - Active, grounding, nature-connected
   - Perfect for: Hiking, gardening, outdoor adventures

4. **Focused Achiever** (`focused-achiever.json`)
   - Productive, clear-headed, motivated
   - Perfect for: Work projects, organizing, goal completion

5. **Neon Arcade Brain** (`neon-arcade-brain.json`)
   - Fast-paced, mentally stimulating, playful
   - Perfect for: Gaming, learning, creative problem-solving

### Social & Connection

6. **Social Butterfly** (`social-butterfly.json`)
   - Social, conversational, giggly
   - Perfect for: Parties, gatherings, group hangouts

7. **Weekend Warrior** (`weekend-warrior.json`)
   - Celebratory, memorable, fun-focused
   - Perfect for: Special occasions, intentional enjoyment

### Creative & Introspective

8. **Creative Fire** (`creative-fire.json`)
   - Artistic, inspiring, flow state inducing
   - Perfect for: Art, music, writing, design work

9. **Midnight Philosopher** (`midnight-philosopher.json`)
   - Contemplative, cerebral, introspective
   - Perfect for: Late-night conversations, journaling, deep thinking

10. **Mystical Wanderer** (`mystical-wanderer.json`)
    - Spiritual, consciousness-expanding, insightful
    - Perfect for: Meditation, spiritual practices, profound experiences

### Relaxation & Comfort

11. **Cozy Nest Builder** (`cozy-nest-builder.json`)
    - Comforting, relaxing, homebody vibes
    - Perfect for: Movies, reading, domestic bliss

12. **Night Owl Dreamer** (`night-owl-dreamer.json`)
    - Sedating, sleep-inducing, deeply relaxing
    - Perfect for: Winding down, preparing for sleep

13. **Healing Heart** (`healing-heart.json`)
    - Therapeutic, pain-relief focused, restorative
    - Perfect for: Wellness, recovery, stress relief

### Balance & Sensory

14. **Zen Garden Keeper** (`zen-garden-keeper.json`)
    - Centered, mindful, balanced
    - Perfect for: Meditation, yoga, present awareness

15. **Balanced Harmonizer** (`balanced-harmonizer.json`)
    - Versatile, moderate, all-purpose
    - Perfect for: Any time of day, various activities

16. **Sensory Explorer** (`sensory-explorer.json`)
    - Sensory-enhancing, perceptual, experiential
    - Perfect for: Music, food, art appreciation

## Seasonal Rotation

The `seasonal-rotation.json` file controls which personas are featured during different time periods:

- **Seasonal Themes**: Winter, Spring, Summer, Fall
- **Weekly Rotation**: 4-week rotating cycle
- **Special Events**: New Year, Earth Day, Summer Solstice, Halloween
- **Fallback**: Default personas when no special period is active

### Using Seasonal Rotation

```typescript
import seasonalConfig from '@/data/myflowerai/personas/seasonal-rotation.json';

// Get current featured personas based on date
const currentDate = new Date();
const featuredPersonas = getCurrentFeaturedPersonas(currentDate, seasonalConfig);
```

## Usage in Quiz System

Personas integrate with the quiz system to provide:

1. **Result Mapping**: Quiz responses map to persona archetypes
2. **Strain Recommendations**: Persona tag profiles filter strain database
3. **Visual Theming**: Image keywords generate themed visuals
4. **User Understanding**: Rich descriptions help users identify with results

### Loading Personas

```typescript
import goldenHourOptimist from '@/data/myflowerai/personas/golden-hour-optimist.json';
import { loadAllPersonas } from '@/lib/myflowerai/personas';

// Load single persona
const persona = goldenHourOptimist;

// Load all personas
const allPersonas = await loadAllPersonas();
```

## Design Principles

1. **Archetypal**: Each persona represents a distinct, recognizable type
2. **Inclusive**: Personas cover diverse preferences and lifestyles
3. **Non-judgmental**: All personas are presented equally and positively
4. **Educational**: Focus on effects and experiences, not products
5. **Privacy-Safe**: No personal data stored in persona definitions

## Tag System

### Primary Tags
Core effects that define the persona's main experience goals.
- Examples: `uplifting`, `relaxing`, `creative`, `social`, `focused`

### Secondary Tags
Supporting characteristics that complement the main experience.
- Examples: `mood-enhancing`, `energizing`, `balanced`, `cerebral`

### Avoid Tags
Effects to specifically avoid for this persona type.
- Examples: `couch-lock`, `anxious`, `foggy`, `overwhelming`

## Image Style Keywords

Keywords used for AI-generated imagery or visual theming:
- Color palettes
- Lighting styles
- Atmospheric descriptions
- Mood descriptors
- Aesthetic references

## Updating Personas

### Adding New Personas

1. Create new JSON file: `{persona-id}.json`
2. Follow the schema structure
3. Ensure unique `persona_id`
4. Add to appropriate seasonal rotation (optional)
5. Update this README

### Modifying Existing Personas

1. Edit the persona JSON file
2. Maintain schema structure
3. Update `seasonal-rotation.json` if needed
4. Document changes in git commit

### Schema Changes

If adding new fields to the schema:
1. Update all existing persona files
2. Update TypeScript types (`/lib/myflowerai/personas/types.ts`)
3. Update documentation
4. Test with quiz system

## File Conventions

- **File Names**: Use kebab-case (e.g., `golden-hour-optimist.json`)
- **Persona IDs**: Match file name (e.g., `"persona_id": "golden-hour-optimist"`)
- **Display Names**: Title Case (e.g., `"display_name": "Golden Hour Optimist"`)
- **Formatting**: 2-space indentation, UTF-8 encoding

## Related Documentation

- [Quiz System Overview](/docs/myflowerai/quizzes.md)
- [Strain Schema](/docs/myflowerai/schema.md)
- [Personal Fit Tracking](/docs/myflowerai/personal-fit.md)
- [Persona Packs Documentation](/docs/myflowerai/persona-packs.md)

## Version History

- **v1.0** (January 2027): Initial release with 16 base personas
  - Energy & Activity personas (5)
  - Social & Connection personas (2)
  - Creative & Introspective personas (3)
  - Relaxation & Comfort personas (3)
  - Balance & Sensory personas (3)
  - Seasonal rotation system

---

**Maintainer**: Brooks AI HUB Team  
**Last Updated**: January 27, 2027  
**Status**: Active
