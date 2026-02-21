import { formatDmOccupancy } from "@/lib/commons/dm-occupancy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const occupancySnapshots = {
    oneToOne: formatDmOccupancy(2, 4),
    threeMembers: formatDmOccupancy(3, 4),
    fullCapacity: formatDmOccupancy(4, 4),
  };

  assert(
    occupancySnapshots.oneToOne === "Members 2/4",
    "expected 1:1 DM occupancy label to show total members"
  );
  assert(
    occupancySnapshots.threeMembers === "Members 3/4",
    "expected 3-member DM occupancy label to show total members"
  );
  assert(
    occupancySnapshots.fullCapacity === "Members 4/4",
    "expected full-capacity DM occupancy label to show total members"
  );

  console.log("✅ dm occupancy label snapshots passed", occupancySnapshots);
}

run();
