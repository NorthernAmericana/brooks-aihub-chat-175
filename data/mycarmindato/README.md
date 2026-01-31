# MyCarMindATO Data

This directory contains data files used by the MyCarMindATO agent (`/MyCarMindATO/`).

## Files

### season-1-cities.json

A comprehensive JSON file containing information about cities that MyCarMindATO can provide information about. The agent uses this data to match user queries with city information and provide contextual travel assistance.

**Season 1 Status**: Maximum capacity of 200 real cities. Currently includes 17 real cities (10 Alabama + 7 Florida) with comprehensive data, plus 199 placeholder entries used for testing.

**Current count**: 216 total entries in file (17 real cities + 199 placeholder entries)
**Capacity**: 17/200 real cities (183 slots remaining)

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
- `notable_businesses` (array): Local businesses worth visiting (optional; target is ~50 businesses per city over time, current coverage varies)
- `place_taxonomy` (object): Categorized places (optional)

**Season 1 Cities** (complete, comprehensive data):
1. Huntsville, Alabama (added January 2026)
2. Birmingham, Alabama (added January 2026)
3. Montgomery, Alabama (added January 2026)
4. Mobile, Alabama (added January 2026)
5. Tuscaloosa, Alabama (added January 2026)
6. Hoover, Alabama (added January 2026)
7. Dothan, Alabama (added January 2026)
8. Auburn, Alabama (added January 2026)
9. Decatur, Alabama (added January 2026)
10. Madison, Alabama (added January 2026)
11. Pensacola, Florida (original)
12. Jacksonville, Florida (added January 2026)
13. Miami, Florida (added January 2026)
14. Tampa, Florida (added January 2026)
15. Orlando, Florida (added January 2026)
16. St. Petersburg, Florida (added January 2026)
17. Pace/Milton/Avalon, Florida (added January 2026)

### season-1-plaza-rest-stops.json

A JSON file containing high-signal rest stops, service plazas, and welcome centers for MyCarMindATO Season 1. This dataset is intended to help the agent recommend reliable pit-stops (restrooms, fuel, food, EV charging, pet breaks) and to support route planning across Florida highways.

**Season 1 Status**: Curated list (currently includes 10 iconic Florida service plazas + welcome centers).

**Structure**: Each entry contains:

- `name` (string): Rest stop / plaza name
- `kind` (string): `service_plaza` or `welcome_center`
- `highway` (string): Highway/road system (e.g., "Florida's Turnpike", "I-95")
- `mile_marker` (string, optional): Turnpike mile marker when applicable
- `location` (object): City/county/state and notes
- `access` (object): Directional access, center-median info for turnpike plazas
- `hours` (string): Operating hours summary
- `amenities` (object): Fuel, dining, EV charging, Wi‑Fi, pet/picnic areas, and other notes
- `highlights` (array): Quick reasons the stop is notable
- `road_tripper_tip` (string): Why/when to use this stop
- `sources` (array): High-level source domains referenced in research

## How City Data is Used

The MyCarMindATO workflow (`lib/ai/agents/mycarmindato-workflow.ts`) automatically:

1. Loads city data from `season-1-cities.json`
2. Matches cities based on user messages and home location
3. Injects relevant city context into agent conversations
4. Limits results to top 3 matching cities to keep context manageable

No additional configuration is needed - just add cities to the JSON file following the existing schema.

## How Rest Stop Data is Used

The MyCarMindATO workflow (`lib/ai/agents/mycarmindato-workflow.ts`) also:

1. Loads rest stop data from `season-1-plaza-rest-stops.json`
2. Matches stops based on user messages and home location
3. Injects relevant rest stop context into agent conversations
4. Limits results to top 3 matching stops to keep context manageable

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

For rest stop data tests, run:
```bash
npx tsx tests/unit/mycarmindato/rest-stop-data.test.ts
```

## Source Documentation

For detailed source material and research notes, see:
- `florida_cities_overview.md` - Overview information for Florida cities
- `docs/mycarmindato/location-knowledge.md` - Combined national location dictionary and Season 1 city coverage
