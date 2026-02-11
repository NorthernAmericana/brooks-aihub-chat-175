export const CAMPFIRE_SEGMENT_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESERVED_CAMPFIRE_SEGMENTS = new Set(["submit"]);

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

  for (const segment of segments) {
    if (!CAMPFIRE_SEGMENT_REGEX.test(segment)) {
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
