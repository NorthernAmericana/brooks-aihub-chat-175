export const CAMPFIRE_SEGMENT_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEGACY_DM_RECIPIENT_SEGMENT_REGEX =
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESERVED_CAMPFIRE_SEGMENTS = new Set(["submit"]);

function isValidCampfireSegment(
  segment: string,
  index: number,
  segments: string[]
): boolean {
  if (CAMPFIRE_SEGMENT_REGEX.test(segment)) {
    return true;
  }

  return (
    segments.length === 2 &&
    segments[0] === "dm" &&
    index === 1 &&
    LEGACY_DM_RECIPIENT_SEGMENT_REGEX.test(segment)
  );
}

export function isValidCampfirePathValue(value: string): boolean {
  const segments = value
    .split("/")
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);

  if (segments.length < 1 || segments.length > 2) {
    return false;
  }

  return segments.every((segment, index) =>
    isValidCampfireSegment(segment, index, segments)
  );
}

type CampfirePathValidationResult =
  | {
      isValid: true;
      segments: string[];
      campfirePath: string;
    }
  | {
      isValid: false;
      reason: string;
    };

export function normalizeCampfireSegments(input: string[] | undefined): string[] {
  if (!input) {
    return [];
  }

  return input.map((segment) => segment.trim().toLowerCase());
}

export function validateCampfirePath(
  input: string[] | undefined
): CampfirePathValidationResult {
  const segments = normalizeCampfireSegments(input);

  if (segments.length < 1 || segments.length > 2) {
    return {
      isValid: false,
      reason: "Campfire path depth must be between 1 and 2 segments.",
    };
  }

  for (const [index, segment] of segments.entries()) {
    if (!isValidCampfireSegment(segment, index, segments)) {
      return {
        isValid: false,
        reason: `Invalid campfire segment: ${segment}`,
      };
    }

    if (RESERVED_CAMPFIRE_SEGMENTS.has(segment)) {
      return {
        isValid: false,
        reason: `Reserved campfire segment: ${segment}`,
      };
    }
  }

  return {
    isValid: true,
    segments,
    campfirePath: segments.join("/"),
  };
}

export function isValidPostId(postId: string): boolean {
  return UUID_REGEX.test(postId.trim());
}
