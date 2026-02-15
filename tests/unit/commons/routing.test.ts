import { isValidCampfirePathValue, validateCampfirePath } from "@/lib/commons/routing";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(
    isValidCampfirePathValue("dm/friend@example.com"),
    "expected legacy DM email paths to be accepted"
  );

  const valid = validateCampfirePath(["dm", "friend@example.com"]);
  assert(valid.isValid, "expected dm email route segments to pass validation");

  const invalid = validateCampfirePath(["community", "friend@example.com"]);
  assert(!invalid.isValid, "expected non-dm email route segments to remain invalid");

  console.log("✅ commons routing validation tests passed");
}

run();
