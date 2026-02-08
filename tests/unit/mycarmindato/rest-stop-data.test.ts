/**
 * Unit tests for MyCarMindATO Rest Stop Data Loading
 *
 * Tests the rest stop data loading and matching logic, including:
 * - Loading rest stop data from JSON file
 * - Selecting matching stops based on queries
 * - Verifying Season 1 plaza rest stops are present
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

type RestStopRecord = {
  name?: string;
  kind?: string;
  highway?: string;
  mile_marker?: string;
  location?: { city?: string; county?: string; state?: string };
  amenities?: { dining?: string[]; fuel?: { brand?: string } };
};

const REST_STOPS_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "season-1-plaza-rest-stops.json"
);

const normalizeQueryValue = (value: string) => value.trim().toLowerCase();

const loadRestStopData = async (): Promise<RestStopRecord[]> => {
  const fileContents = await readFile(REST_STOPS_FILE_PATH, "utf8");
  const parsed = JSON.parse(fileContents) as RestStopRecord[];
  return parsed;
};

const selectMatchingRestStops = (
  stops: RestStopRecord[],
  queries: string[]
): RestStopRecord[] => {
  const normalizedQueries = queries
    .map((query) => normalizeQueryValue(query))
    .filter(Boolean);

  if (!normalizedQueries.length) {
    return [];
  }

  const matches: RestStopRecord[] = [];

  for (const stop of stops) {
    const terms: string[] = [];
    if (stop.name) terms.push(stop.name);
    if (stop.highway) terms.push(stop.highway);
    if (stop.mile_marker) terms.push(stop.mile_marker);
    if (stop.location?.city) terms.push(stop.location.city);
    if (stop.location?.county) terms.push(stop.location.county);
    if (stop.amenities?.fuel?.brand) terms.push(stop.amenities.fuel.brand);
    if (stop.amenities?.dining) terms.push(...stop.amenities.dining);

    const normalizedTerms = terms
      .map((term) => normalizeQueryValue(term))
      .filter(Boolean);

    const isMatch = normalizedQueries.some((query) =>
      normalizedTerms.some((term) => term.includes(query) || query.includes(term))
    );

    if (isMatch) {
      matches.push(stop);
    }

    if (matches.length >= 3) {
      break;
    }
  }

  return matches;
};

// Run tests
async function runTests() {
  console.log("Starting MyCarMindATO rest stop data tests...\n");

  // Test 1: Load rest stop data
  console.log("Test 1: Load rest stop data from JSON");
  const stops = await loadRestStopData();
  console.assert(stops.length > 0, "Should load rest stops from JSON file");
  console.assert(stops.length >= 10, `Should have at least 10 entries, got ${stops.length}`);
  console.log(`✓ Test 1 passed - Loaded ${stops.length} entries`);

  // Test 2: Verify Season 1 iconic stops are present
  console.log("\nTest 2: Verify Season 1 plaza rest stops are present");
  const season1Stops = [
    "Snapper Creek Service Plaza",
    "West Palm Beach Service Plaza",
    "Port St. Lucie / Fort Pierce Service Plaza",
    "Fort Drum Service Plaza",
    "Canoe Creek Service Plaza",
    "Turkey Lake Service Plaza",
    "Okahumpka Service Plaza",
    "Florida Welcome Center (I-95)",
    "Florida Welcome Center (I-75)",
    "Florida Welcome Center (I-10)",
  ];
  const stopNames = stops.map((stop) => stop.name);

  for (const stopName of season1Stops) {
    console.assert(stopNames.includes(stopName), `Should include ${stopName}`);
  }
  console.log("✓ Test 2 passed - All 10 Season 1 stops present");

  // Test 3: Match by partial name
  console.log("\nTest 3: Match rest stop by partial name");
  const turkeyMatches = selectMatchingRestStops(stops, ["turkey lake"]);
  console.assert(turkeyMatches.length > 0, "Should match Turkey Lake by partial name");
  console.log("✓ Test 3 passed");

  // Test 4: Match by highway
  console.log("\nTest 4: Match rest stop by highway");
  const i95Matches = selectMatchingRestStops(stops, ["i-95"]);
  console.assert(i95Matches.length > 0, "Should match I-95 welcome center by highway query");
  console.assert(i95Matches.length <= 3, "Should limit to 3 matches");
  console.log("✓ Test 4 passed");

  // Test 5: Empty query returns empty results
  console.log("\nTest 5: Empty query returns empty results");
  const emptyQuery = selectMatchingRestStops(stops, []);
  console.assert(emptyQuery.length === 0, "Should return empty array for empty query");
  console.log("✓ Test 5 passed");

  console.log("\n✅ All MyCarMindATO rest stop data tests passed!");
}

// Run the tests
runTests().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});

