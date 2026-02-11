import { getCampfireHref, listActiveCampfires } from "@/lib/commons/campfires";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const activityCampfires = await listActiveCampfires();

  assert(
    activityCampfires.length > 0,
    "expected active campfires to be returned"
  );
  assert(
    activityCampfires.every((campfire) => campfire.slug !== "archive"),
    "expected inactive campfires to be excluded"
  );
  assert(
    Date.parse(activityCampfires[0].lastActivityAt) >=
      Date.parse(activityCampfires[1].lastActivityAt),
    "expected default ordering to be by last activity"
  );

  const alphabeticalCampfires = await listActiveCampfires({
    sort: "alphabetical",
  });

  assert(
    alphabeticalCampfires[0].name.localeCompare(
      alphabeticalCampfires[1].name
    ) <= 0,
    "expected alphabetical sorting"
  );

  const filteredCampfires = await listActiveCampfires({
    query: "founder support",
  });

  assert(
    filteredCampfires.length === 1,
    "expected query filter to narrow the result"
  );
  assert(
    filteredCampfires[0].slug === "builders-circle",
    "expected query filter to match on description"
  );

  const path = getCampfireHref(["community camp", "builders circle"]);
  assert(
    path === "/commons/community%20camp/builders%20circle",
    "expected route helper to encode path segments"
  );

  console.log("✅ commons campfire directory tests passed");
}

run();
