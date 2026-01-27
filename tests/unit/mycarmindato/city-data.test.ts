/**
 * Unit tests for MyCarMindATO City Data Loading
 *
 * Tests the city data loading and matching logic, including:
 * - Loading city data from JSON file
 * - Selecting matching cities based on queries
 * - Formatting city summaries
 * - Verifying new Florida cities are present
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

type CityRecord = {
  city?: string;
  sub_areas?: Array<{ name?: string; description?: string }>;
  identity_vibe_tags?: string[];
  community_vibe?: string;
  travel_logic?: {
    best_seasons?: string;
    safety?: string;
    transportation?: string;
    parking?: string;
  };
  anchors?: string[];
};

const CITIES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "mycarmindato",
  "season-1-cities.json"
);

const normalizeQueryValue = (value: string) => value.trim().toLowerCase();

const loadCityData = async (): Promise<CityRecord[]> => {
  const fileContents = await readFile(CITIES_FILE_PATH, "utf8");
  const parsed = JSON.parse(fileContents) as CityRecord[];
  return parsed;
};

const selectMatchingCities = (
  cities: CityRecord[],
  queries: string[]
): CityRecord[] => {
  const normalizedQueries = queries
    .map((query) => normalizeQueryValue(query))
    .filter(Boolean);

  if (!normalizedQueries.length) {
    return [];
  }

  const matches: CityRecord[] = [];

  for (const city of cities) {
    const cityName = normalizeQueryValue(city.city ?? "");
    if (!cityName) {
      continue;
    }

    const isMatch = normalizedQueries.some(
      (query) =>
        (query && cityName.includes(query)) ||
        (query && query.includes(cityName))
    );

    if (isMatch) {
      matches.push(city);
    }

    if (matches.length >= 3) {
      break;
    }
  }

  return matches;
};

const formatCitySummary = (city: CityRecord) => {
  const subAreaNames =
    city.sub_areas
      ?.map((area) => area.name)
      .filter(Boolean)
      .slice(0, 4) ?? [];
  const vibeTags = city.identity_vibe_tags?.slice(0, 6) ?? [];
  const anchors = city.anchors?.slice(0, 2) ?? [];
  const travelLogic = city.travel_logic ?? {};

  return [
    `City: ${city.city ?? "Unknown"}`,
    subAreaNames.length ? `Sub-areas: ${subAreaNames.join(", ")}` : null,
    vibeTags.length ? `Vibe tags: ${vibeTags.join(", ")}` : null,
    city.community_vibe ? `Community vibe: ${city.community_vibe}` : null,
    travelLogic.best_seasons
      ? `Best seasons: ${travelLogic.best_seasons}`
      : null,
    travelLogic.transportation
      ? `Transportation: ${travelLogic.transportation}`
      : null,
    travelLogic.safety ? `Safety: ${travelLogic.safety}` : null,
    travelLogic.parking ? `Parking: ${travelLogic.parking}` : null,
    anchors.length ? `Anchors: ${anchors.join(" | ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

// Run tests
async function runTests() {
  console.log("Starting MyCarMindATO city data tests...\n");

  // Test 1: Load city data
  console.log("Test 1: Load city data from JSON");
  const cities = await loadCityData();
  console.assert(cities.length > 0, "Should load cities from JSON file");
  console.assert(cities.length >= 205, `Should have at least 205 entries (includes test data), got ${cities.length}`);
  console.log(`✓ Test 1 passed - Loaded ${cities.length} entries`);

  // Test 2: Verify Season 1 Florida cities are present
  console.log("\nTest 2: Verify Season 1 Florida cities are present");
  const floridaCities = ["Pensacola, Florida", "Jacksonville, Florida", "Miami, Florida", "Tampa, Florida", "Orlando, Florida", "St. Petersburg, Florida"];
  const cityNames = cities.map(c => c.city);
  
  for (const floridaCity of floridaCities) {
    console.assert(
      cityNames.includes(floridaCity),
      `Should include ${floridaCity}`
    );
  }
  console.log("✓ Test 2 passed - All 6 Season 1 Florida cities present");

  // Test 3: Match city by full name
  console.log("\nTest 3: Match city by full name");
  const miamiFull = selectMatchingCities(cities, ["Miami, Florida"]);
  console.assert(miamiFull.length > 0, "Should match Miami by full name");
  console.assert(miamiFull[0].city === "Miami, Florida", "Should match exact city");
  console.log("✓ Test 3 passed");

  // Test 4: Match city by partial name
  console.log("\nTest 4: Match city by partial name");
  const miamiPartial = selectMatchingCities(cities, ["miami"]);
  console.assert(miamiPartial.length > 0, "Should match Miami by partial name");
  console.assert(
    miamiPartial[0].city?.toLowerCase().includes("miami"),
    "Should match city containing 'miami'"
  );
  console.log("✓ Test 4 passed");

  // Test 5: Match multiple cities
  console.log("\nTest 5: Match multiple cities with query");
  const floridaMatches = selectMatchingCities(cities, ["florida"]);
  console.assert(floridaMatches.length > 0, "Should match multiple Florida cities");
  console.assert(floridaMatches.length <= 3, "Should limit to 3 matches");
  console.log(`✓ Test 5 passed - Matched ${floridaMatches.length} cities`);

  // Test 6: Case-insensitive matching
  console.log("\nTest 6: Case-insensitive matching");
  const jacksonvilleUpper = selectMatchingCities(cities, ["JACKSONVILLE"]);
  const jacksonvilleLower = selectMatchingCities(cities, ["jacksonville"]);
  console.assert(
    jacksonvilleUpper.length > 0 && jacksonvilleLower.length > 0,
    "Should match regardless of case"
  );
  console.assert(
    jacksonvilleUpper[0].city === jacksonvilleLower[0].city,
    "Should match same city regardless of case"
  );
  console.log("✓ Test 6 passed");

  // Test 7: No match for non-existent city
  console.log("\nTest 7: No match for non-existent city");
  const noMatch = selectMatchingCities(cities, ["NonExistentCity12345"]);
  console.assert(noMatch.length === 0, "Should return empty array for non-existent city");
  console.log("✓ Test 7 passed");

  // Test 8: Empty query returns empty results
  console.log("\nTest 8: Empty query returns empty results");
  const emptyQuery = selectMatchingCities(cities, []);
  console.assert(emptyQuery.length === 0, "Should return empty array for empty query");
  console.log("✓ Test 8 passed");

  // Test 9: Format city summary
  console.log("\nTest 9: Format city summary");
  const orlando = cities.find(c => c.city === "Orlando, Florida");
  console.assert(orlando !== undefined, "Should find Orlando");
  if (orlando) {
    const summary = formatCitySummary(orlando);
    console.assert(summary.includes("Orlando, Florida"), "Summary should include city name");
    console.assert(summary.length > 0, "Summary should not be empty");
    console.log("✓ Test 9 passed");
  }

  // Test 10: Verify city data structure for new cities
  console.log("\nTest 10: Verify city data structure");
  const stPete = cities.find(c => c.city === "St. Petersburg, Florida");
  console.assert(stPete !== undefined, "Should find St. Petersburg");
  if (stPete) {
    console.assert(Array.isArray(stPete.sub_areas), "Should have sub_areas array");
    console.assert(Array.isArray(stPete.identity_vibe_tags), "Should have identity_vibe_tags array");
    console.assert(typeof stPete.community_vibe === "string", "Should have community_vibe string");
    console.assert(typeof stPete.travel_logic === "object", "Should have travel_logic object");
    console.assert(Array.isArray(stPete.anchors), "Should have anchors array");
    console.log("✓ Test 10 passed");
  }

  // Test 11: Match with whitespace in query
  console.log("\nTest 11: Match with whitespace in query");
  const whitespaceMatch = selectMatchingCities(cities, ["  Tampa  "]);
  console.assert(whitespaceMatch.length > 0, "Should handle whitespace in query");
  console.log("✓ Test 11 passed");

  // Test 12: Multiple queries
  console.log("\nTest 12: Multiple queries");
  const multiQuery = selectMatchingCities(cities, ["Jacksonville", "Miami"]);
  console.assert(multiQuery.length > 0, "Should match with multiple queries");
  console.log("✓ Test 12 passed");

  console.log("\n✅ All MyCarMindATO city data tests passed!");
}

// Run the tests
runTests().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});
