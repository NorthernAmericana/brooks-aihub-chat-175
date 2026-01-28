# MyFlowerAI Persona Packs Documentation

## Overview

Persona Packs are a core component of the MyFlowerAI recommendation system, providing rich, archetypal user profiles that bridge the gap between quiz responses and strain recommendations. Each persona represents a distinct lifestyle, preference pattern, and desired experience, making it easier for users to understand their results and find strains that match their needs.

## What are Persona Packs?

A persona pack is a structured data model that encapsulates:

1. **Identity**: A unique identifier and user-friendly name
2. **Personality**: A rich description of the user archetype
3. **Preferences**: Tag profiles that map to strain characteristics
4. **Visual Style**: Keywords for theming and imagery

Think of personas as "character classes" in a game—each has distinct attributes, strengths, and ideal scenarios.

## Schema Definition

### Persona Structure

```typescript
interface Persona {
  persona_id: string;              // Unique identifier (kebab-case)
  display_name: string;            // User-facing name (Title Case)
  vibe_summary: string;            // Rich description (2-3 sentences)
  tag_profile: {
    primary_tags: string[];        // Core effect tags (3-5 items)
    secondary_tags: string[];      // Supporting tags (2-4 items)
    avoid_tags?: string[];         // Tags to exclude (2-4 items)
  };
  image_style_keywords: string[];  // Visual theming (4-8 keywords)
}
```

### Field Descriptions

#### `persona_id`
- **Type**: `string`
- **Format**: kebab-case (e.g., `"golden-hour-optimist"`)
- **Purpose**: Unique identifier used in code and file names
- **Constraints**: Must be unique across all personas, no spaces or special characters

#### `display_name`
- **Type**: `string`
- **Format**: Title Case (e.g., `"Golden Hour Optimist"`)
- **Purpose**: User-facing label shown in quiz results and UI
- **Guidelines**: Should be evocative, positive, and memorable (2-4 words)

#### `vibe_summary`
- **Type**: `string`
- **Length**: 200-400 characters (2-3 sentences)
- **Purpose**: Describes the persona's lifestyle, preferences, and ideal experiences
- **Tone**: Second-person ("You're..."), positive, non-judgmental
- **Content**: Should help users self-identify and understand strain recommendations

#### `tag_profile`
An object containing three tag arrays that define the persona's strain preferences:

**`primary_tags`**
- **Purpose**: Core effects this persona seeks
- **Count**: 3-5 tags
- **Examples**: `"uplifting"`, `"creative"`, `"relaxing"`, `"social"`
- **Weight**: Highest priority in strain matching

**`secondary_tags`**
- **Purpose**: Complementary effects that enhance the experience
- **Count**: 2-4 tags
- **Examples**: `"mood-enhancing"`, `"focused"`, `"balanced"`
- **Weight**: Medium priority in strain matching

**`avoid_tags`** (optional)
- **Purpose**: Effects to specifically exclude
- **Count**: 2-4 tags
- **Examples**: `"couch-lock"`, `"anxious"`, `"foggy"`
- **Weight**: Veto power (strains with these tags get score of 0)

#### `image_style_keywords`
- **Type**: `string[]`
- **Count**: 4-8 keywords
- **Purpose**: Visual theming for UI, AI image generation, or aesthetic presentation
- **Categories**: Colors, lighting, mood, atmosphere, textures
- **Examples**: `"warm golden light"`, `"vibrant neon"`, `"soft textures"`

## Creating Effective Personas

### Design Principles

1. **Archetypal**: Each persona should represent a recognizable type
2. **Distinct**: Clear differentiation between personas
3. **Relatable**: Users should easily see themselves in one or more personas
4. **Balanced**: Cover diverse preferences and lifestyles
5. **Positive**: All personas are valuable and non-judgmental
6. **Actionable**: Tag profiles should directly map to strain filters

### Persona Categories

Organize personas across multiple dimensions:

#### Energy Level Spectrum
- **High Energy**: Adventure Seeker, Neon Arcade Brain, Forest Wanderer
- **Moderate**: Focused Achiever, Social Butterfly, Creative Fire
- **Low Energy**: Cozy Nest Builder, Zen Garden Keeper, Healing Heart
- **Sedating**: Night Owl Dreamer, Midnight Philosopher (for wind-down)

#### Social vs. Introspective
- **Highly Social**: Social Butterfly, Weekend Warrior
- **Balanced**: Golden Hour Optimist, Sensory Explorer
- **Introspective**: Midnight Philosopher, Mystical Wanderer, Zen Garden Keeper

#### Activity Type
- **Physical**: Forest Wanderer, Adventure Seeker
- **Mental**: Focused Achiever, Neon Arcade Brain
- **Creative**: Creative Fire, Sensory Explorer
- **Restorative**: Healing Heart, Cozy Nest Builder

### Writing Vibe Summaries

Good vibe summaries are:
- **Personal**: Use second-person ("You")
- **Evocative**: Create emotional resonance
- **Specific**: Include concrete activities and scenarios
- **Comprehensive**: Cover lifestyle, preferences, and goals

**Example Structure**:
1. Opening hook (1 sentence): Core characteristic
2. Context (1-2 sentences): When/where this persona shines
3. Strain preference (1 sentence): What they seek in cannabis

```
You're all about those warm, uplifting vibes. Like the perfect sunset glow, 
you bring positive energy wherever you go. You thrive during transitions—
morning coffee creativity or evening wind-down moments. Your ideal strains 
enhance mood, inspire gratitude, and help you see the beauty in everyday moments.
```

### Selecting Tags

#### Tag Taxonomy

**Effect Categories**:
- Energy: `energizing`, `stimulating`, `active`, `uplifting`, `sedating`, `relaxing`
- Mind: `focused`, `creative`, `cerebral`, `introspective`, `clear-headed`, `foggy`
- Body: `pain-relief`, `body-relaxation`, `grounding`, `couch-lock`
- Mood: `mood-enhancing`, `euphoric`, `calming`, `giggly`, `anxious`
- Social: `social`, `antisocial`, `conversational`
- Sensory: `sensory-enhancing`, `psychedelic`

**Tag Selection Strategy**:
1. Choose 3-5 primary tags that define the core experience
2. Add 2-4 secondary tags for nuance
3. Include 2-4 avoid tags to filter out mismatches
4. Ensure tag combinations are realistic and coherent

#### Tag Combinations

Some effective combinations:

```json
// Energetic Social Persona
{
  "primary_tags": ["energizing", "social", "uplifting", "euphoric"],
  "secondary_tags": ["mood-enhancing", "creative"],
  "avoid_tags": ["couch-lock", "introspective", "sedating"]
}

// Creative Flow Persona
{
  "primary_tags": ["creative", "focused", "inspiring", "cerebral"],
  "secondary_tags": ["uplifting", "energizing"],
  "avoid_tags": ["foggy", "confused", "lethargic"]
}

// Relaxation Persona
{
  "primary_tags": ["relaxing", "calming", "cozy", "comforting"],
  "secondary_tags": ["mood-enhancing", "mellow"],
  "avoid_tags": ["racy", "anxious", "paranoid"]
}
```

## Seasonal Quiz Rotation

The seasonal rotation system allows dynamic featuring of personas based on time of year, creating a fresh, contextually relevant experience.

### Rotation Configuration

Located at: `/data/myflowerai/personas/seasonal-rotation.json`

```typescript
interface SeasonalRotation {
  config_version: string;
  rotation_type: "weekly" | "monthly" | "seasonal";
  default_quiz: string;
  featured_schedule: SeasonalPeriod[];
  weekly_rotation: WeeklyFeature[];
  special_events: SpecialEvent[];
  fallback_rotation: FallbackConfig;
}
```

### Rotation Types

#### 1. Seasonal Themes
Long-term periods (3 months) aligned with seasons:

```json
{
  "id": "winter-cozy-2026",
  "start_date": "2026-12-21",
  "end_date": "2027-03-19",
  "featured_personas": [
    "cozy-nest-builder",
    "night-owl-dreamer",
    "midnight-philosopher",
    "healing-heart"
  ],
  "theme": "Winter Comfort",
  "description": "Embrace cozy, introspective winter vibes"
}
```

**Season Guidelines**:
- **Winter**: Cozy, introspective, healing personas
- **Spring**: Renewal, balance, nature-connected personas
- **Summer**: Energetic, social, adventurous personas
- **Fall**: Creative, focused, contemplative personas

#### 2. Weekly Rotation
4-week rotating cycle for variety:

```json
{
  "week": 1,
  "featured_persona": "golden-hour-optimist",
  "tagline": "Start your month with optimism"
}
```

#### 3. Special Events
Date-specific featured personas:

```json
{
  "event_id": "new-year-2027",
  "start_date": "2026-12-31",
  "end_date": "2027-01-02",
  "featured_personas": ["golden-hour-optimist", "focused-achiever"],
  "theme": "New Year, New You"
}
```

### Implementation

```typescript
// Example: Get current featured personas
function getCurrentFeaturedPersonas(
  currentDate: Date, 
  config: SeasonalRotation
): string[] {
  // 1. Check special events first (highest priority)
  const specialEvent = config.special_events.find(event => 
    isWithinDateRange(currentDate, event.start_date, event.end_date)
  );
  if (specialEvent) return specialEvent.featured_personas;
  
  // 2. Check seasonal schedule
  const season = config.featured_schedule.find(period => 
    isWithinDateRange(currentDate, period.start_date, period.end_date)
  );
  if (season) return season.featured_personas;
  
  // 3. Use weekly rotation
  const weekNumber = getWeekOfMonth(currentDate);
  const weeklyFeature = config.weekly_rotation[weekNumber - 1];
  if (weeklyFeature) return [weeklyFeature.featured_persona];
  
  // 4. Fallback to default
  return config.fallback_rotation.personas;
}
```

## Integration with Quiz System

### Quiz Result Mapping

Personas connect quiz responses to strain recommendations:

```
Quiz Responses → Trait Scores → Profile Match → Persona → Strain Tags → Recommendations
```

#### Step-by-Step Flow

1. **User takes quiz**: Answers questions about preferences and lifestyle
2. **System calculates traits**: Raw scores for each trait dimension
3. **Traits normalized**: Scores converted to 0-1 range
4. **Profile matching**: Scores compared against persona thresholds
5. **Persona assigned**: Best-matching persona selected
6. **Tags extracted**: Persona's tag_profile used for strain filtering
7. **Strains ranked**: Database filtered and sorted by tag overlap
8. **Results displayed**: Top matches shown with persona context

### Enhanced Quiz Schema

Personas can be referenced directly in quiz result profiles:

```json
{
  "result_profiles": [
    {
      "id": "energetic_explorer",
      "name": "The Energetic Explorer",
      "persona_reference": "adventure-seeker",
      "conditions": {
        "uplifting": { "min": 0.6 },
        "active": { "min": 0.5 }
      }
    }
  ]
}
```

### Recommendation Algorithm

```typescript
function generateRecommendations(
  persona: Persona,
  strainDatabase: Strain[]
): Recommendation[] {
  return strainDatabase
    .filter(strain => {
      // Exclude strains with avoid_tags
      const hasAvoidTag = persona.tag_profile.avoid_tags?.some(tag =>
        strain.tags.includes(tag)
      );
      return !hasAvoidTag;
    })
    .map(strain => {
      // Calculate match score based on tag overlap
      const primaryMatches = intersection(
        strain.tags,
        persona.tag_profile.primary_tags
      ).length;
      const secondaryMatches = intersection(
        strain.tags,
        persona.tag_profile.secondary_tags
      ).length;
      
      const score = (
        (primaryMatches * 2) + secondaryMatches
      ) / (
        (persona.tag_profile.primary_tags.length * 2) +
        persona.tag_profile.secondary_tags.length
      );
      
      return { strain, score };
    })
    .filter(rec => rec.score > 0.3) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
```

## UI/UX Implementation

### Persona Card Display

```jsx
<PersonaCard persona={selectedPersona}>
  <PersonaHeader>
    <PersonaIcon keywords={persona.image_style_keywords} />
    <PersonaName>{persona.display_name}</PersonaName>
  </PersonaHeader>
  
  <PersonaDescription>
    {persona.vibe_summary}
  </PersonaDescription>
  
  <TagCloud>
    <PrimaryTags tags={persona.tag_profile.primary_tags} />
    <SecondaryTags tags={persona.tag_profile.secondary_tags} />
  </TagCloud>
  
  <StrainRecommendations persona={persona} />
</PersonaCard>
```

### Visual Theming

Use `image_style_keywords` for:
- Background gradients
- Color scheme selection
- CSS filter effects
- AI-generated imagery
- Icon selection

```typescript
function generateThemeFromKeywords(keywords: string[]): Theme {
  const colorPalette = extractColors(keywords); // "golden", "warm" → yellows/oranges
  const mood = extractMood(keywords); // "optimistic" → bright, saturated
  const lighting = extractLighting(keywords); // "soft glow" → gentle shadows
  
  return {
    background: generateGradient(colorPalette),
    textColor: getContrastColor(colorPalette[0]),
    accentColor: colorPalette[1],
    filter: mood === 'calm' ? 'brightness(0.9)' : 'brightness(1.1)',
  };
}
```

## Best Practices

### Do's ✅

- **Keep personas distinct**: Clear differentiation between types
- **Use positive language**: All personas are valid and valuable
- **Be specific**: Concrete examples help users identify
- **Cover spectrum**: Represent diverse preferences and lifestyles
- **Test combinations**: Ensure tag profiles map to real strains
- **Update seasonally**: Refresh featured personas regularly
- **Maintain consistency**: Follow schema strictly

### Don'ts ❌

- **Stereotype**: Avoid limiting or offensive characterizations
- **Overgeneralize**: Each persona should be specific
- **Contradict tags**: Ensure coherent primary/secondary/avoid combinations
- **Ignore user data**: If analytics available, use insights to refine
- **Create duplicates**: Each persona must offer unique value
- **Use jargon**: Keep language accessible to all users
- **Medical claims**: Never promise therapeutic outcomes

## Maintenance & Updates

### Adding New Personas

1. **Research need**: Identify gaps in current persona coverage
2. **Draft persona**: Follow schema and guidelines
3. **Validate tags**: Ensure tags match strain database
4. **Test visually**: Check image_style_keywords generate good themes
5. **Add to rotation**: Update seasonal-rotation.json if appropriate
6. **Document**: Update README and this doc
7. **Deploy**: Add JSON file to `/data/myflowerai/personas/`

### Updating Existing Personas

**Minor updates** (typos, description refinement):
- Edit JSON file directly
- Document change in commit message
- No version bump needed

**Major updates** (tag changes, structural changes):
- Consider creating new persona version
- Update all references in quiz system
- Test impact on recommendations
- Update documentation

### Deprecating Personas

If a persona is no longer relevant:
1. Remove from seasonal rotation first
2. Monitor usage via analytics
3. After 3 months of zero usage, archive file
4. Move to `/data/myflowerai/personas/archived/`
5. Update documentation

## Analytics & Optimization

### Metrics to Track

- **Persona distribution**: Which personas are most common?
- **User satisfaction**: Do users relate to assigned persona?
- **Recommendation quality**: Do persona-based recommendations perform well?
- **Seasonal performance**: Do seasonal rotations increase engagement?

### Optimization Strategies

1. **A/B test descriptions**: Test different vibe_summary wordings
2. **Refine tag profiles**: Adjust based on recommendation quality
3. **Expand coverage**: Add personas for underserved user types
4. **Update imagery**: Refresh image_style_keywords based on visual testing
5. **Seasonal tuning**: Adjust rotation based on engagement metrics

## Privacy & Safety

### Data Handling

**Persona definitions (public)**:
- ✅ Store in public repository
- ✅ Include in client-side code
- ✅ Share openly

**User assignments (private)**:
- ❌ Never store persona assignments publicly
- ✅ Store in private, per-user database
- ✅ Encrypt if persisted

### Disclaimer Language

Always include with persona-based recommendations:

```
Your persona result is based on your quiz responses and represents general 
preferences, not medical advice. Cannabis effects vary by individual, strain, 
and many other factors. Always start with a low dose and go slow, especially 
with new strains. Consult a healthcare professional for medical guidance.
```

## Technical Reference

### File Locations

```
/data/myflowerai/personas/
├── README.md                      # Directory documentation
├── seasonal-rotation.json         # Rotation configuration
├── golden-hour-optimist.json      # Individual personas
├── midnight-philosopher.json
├── forest-wanderer.json
└── ... (all persona files)

/docs/myflowerai/
└── persona-packs.md              # This file

/lib/myflowerai/personas/
├── types.ts                       # TypeScript interfaces
├── loader.ts                      # Persona loading utilities
└── matcher.ts                     # Quiz-to-persona matching logic
```

### TypeScript Types

```typescript
// /lib/myflowerai/personas/types.ts
export interface Persona {
  persona_id: string;
  display_name: string;
  vibe_summary: string;
  tag_profile: {
    primary_tags: string[];
    secondary_tags: string[];
    avoid_tags?: string[];
  };
  image_style_keywords: string[];
}

export interface SeasonalRotation {
  config_version: string;
  rotation_type: string;
  default_quiz: string;
  featured_schedule: SeasonalPeriod[];
  weekly_rotation: WeeklyFeature[];
  special_events: SpecialEvent[];
  fallback_rotation: FallbackConfig;
}
```

## Examples

### Example 1: High-Energy Social Persona

```json
{
  "persona_id": "social-butterfly",
  "display_name": "Social Butterfly",
  "vibe_summary": "You light up in social settings. Whether hosting dinner parties, hitting up concerts, or just hanging with your crew, you thrive on connection and shared experiences. You need strains that enhance your naturally social nature, boost conversation, and keep the good vibes flowing without making you foggy or antisocial.",
  "tag_profile": {
    "primary_tags": ["social", "uplifting", "euphoric", "giggly"],
    "secondary_tags": ["mood-enhancing", "energizing", "creative"],
    "avoid_tags": ["introspective", "couch-lock", "antisocial", "sedating"]
  },
  "image_style_keywords": [
    "bright social gathering",
    "laughter and connection",
    "vibrant party atmosphere",
    "warm group energy"
  ]
}
```

### Example 2: Relaxed Introspective Persona

```json
{
  "persona_id": "midnight-philosopher",
  "display_name": "Midnight Philosopher",
  "vibe_summary": "Deep thoughts, deep nights. You're drawn to introspective moments when the world quiets down. Whether pondering life's mysteries or having profound conversations, you seek strains that encourage contemplation without overwhelming sedation.",
  "tag_profile": {
    "primary_tags": ["relaxing", "creative", "introspective", "focused"],
    "secondary_tags": ["cerebral", "mood-enhancing", "calming"],
    "avoid_tags": ["high-energy", "racy", "anxious"]
  },
  "image_style_keywords": [
    "deep blue night sky",
    "starlight",
    "contemplative mood",
    "moonlit shadows"
  ]
}
```

## Future Enhancements

### Potential Features

1. **Dynamic personas**: Generated based on user history
2. **Hybrid personas**: Blend of two archetypes
3. **Time-based personas**: Morning vs. evening versions
4. **Situational personas**: Different contexts (home, social, work)
5. **User customization**: Allow users to tweak their persona
6. **Persona evolution**: Change over time based on feedback
7. **Multi-language**: Translate persona descriptions
8. **Voice/tone variants**: Different writing styles for same persona

### Research Opportunities

- Validate personas with user studies
- Analyze persona-strain correlation
- Test seasonal rotation impact on engagement
- Explore machine learning for persona prediction
- Study persona stability over time

## Support & Questions

For questions about persona packs:
- **Documentation**: This file and `/data/myflowerai/personas/README.md`
- **Implementation**: See `/lib/myflowerai/personas/`
- **Quiz integration**: See `/docs/myflowerai/quizzes.md`

---

**Version**: 1.0  
**Last Updated**: January 27, 2027  
**Status**: Active  
**Maintainer**: Brooks AI HUB Team
