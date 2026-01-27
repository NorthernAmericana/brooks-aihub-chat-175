# MyCarMindATO Data

This directory contains data files used by the MyCarMindATO agent (`/MyCarMindATO/`).

## Files

### season-1-cities.json

A comprehensive JSON file containing information about cities that MyCarMindATO can provide information about. The agent uses this data to match user queries with city information and provide contextual travel assistance.

**Current count**: 205 cities (as of January 2026)

**Structure**: Each city entry contains:

- `city` (string): Full city name (e.g., "Miami, Florida")
- `sub_areas` (array): Notable neighborhoods and districts
- `identity_vibe_tags` (array): Descriptive tags for the city's character
- `community_vibe` (string): Detailed description of the city's atmosphere
- `travel_logic` (object): Practical travel information
  - `best_seasons`: Optimal times to visit
  - `safety`: Safety tips and considerations
  - `transportation`: How to get around
  - `parking`: Parking information
- `anchors` (array): Key facts and comparisons that define the city
- `must_dos` (array): Top attractions and activities (optional)
- `notable_businesses` (array): Local businesses worth visiting (optional)
- `place_taxonomy` (object): Categorized places (optional)

**Recent additions** (January 2026):
- Jacksonville, Florida
- Miami, Florida
- Tampa, Florida
- Orlando, Florida
- St. Petersburg, Florida

## How City Data is Used

The MyCarMindATO workflow (`lib/ai/agents/mycarmindato-workflow.ts`) automatically:

1. Loads city data from `season-1-cities.json`
2. Matches cities based on user messages and home location
3. Injects relevant city context into agent conversations
4. Limits results to top 3 matching cities to keep context manageable

No additional configuration is needed - just add cities to the JSON file following the existing schema.

## Adding New Cities

To add new cities:

1. Create entries following the structure shown above
2. Keep entries concise but informative
3. Add to `season-1-cities.json` array
4. Run tests: `npx tsx tests/unit/mycarmindato/city-data.test.ts`
5. The workflow will automatically pick up new cities

## Testing

Unit tests for city data loading and matching are located at:
- `tests/unit/mycarmindato/city-data.test.ts`

Run tests with:
```bash
npx tsx tests/unit/mycarmindato/city-data.test.ts
```

## Source Documentation

For detailed source material and research notes, see:
- `florida_cities_overview.md` - Overview information for Florida cities
