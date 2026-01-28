/**
 * MyFlowerAI Image Generation Safety Module
 *
 * Provides text safety scrubbing for user-provided vibe text to ensure
 * compliance with legal and platform safety requirements.
 */

/**
 * Blocked content patterns for safety filtering
 */
const BLOCKED_PATTERNS = [
  // Illegal sale/distribution
  /\b(sell|selling|buy|buying|purchase|deal|dealer|supplier|supply|distribute|distribution)\b/i,
  /\b(for sale|on sale|wholesale|bulk order|shipping|delivery|mail order)\b/i,

  // Hard drugs (non-cannabis)
  /\b(cocaine|heroin|meth|methamphetamine|fentanyl|crack|ecstasy|mdma|lsd|pcp|ketamine|opioid)\b/i,

  // Minors and age-inappropriate content
  /\b(kid|kids|child|children|minor|minors|teen|teens|teenager|school|student|underage)\b/i,
  /\b(high school|middle school|elementary)\b/i,

  // Weapons and violence
  /\b(gun|guns|weapon|weapons|firearm|rifle|pistol|shoot|shooting|violence|violent|attack|assault)\b/i,

  // Hate speech and discrimination
  /\b(hate|racist|racism|nazi|supremacist|terrorist)\b/i,

  // Medical claims (not allowed for art generation)
  /\b(cure|cures|treat|treatment|medicine|medication|prescription|diagnose|diagnosis|therapy|therapeutic)\b/i,
  /\b(pain relief|anxiety relief|depression treatment|ptsd|cancer|epilepsy|seizure)\b/i,
];

/**
 * Default fallback vibe text when user input is blocked
 */
const NEUTRAL_FALLBACK_TEXT =
  "peaceful abstract art with natural flowing patterns";

/**
 * Check if text contains any blocked content
 *
 * @param text - User-provided text to check
 * @returns true if text contains blocked content
 */
export function containsBlockedContent(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const normalizedText = text.toLowerCase().trim();

  // Check against all blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return true;
    }
  }

  return false;
}

/**
 * Scrub user vibe text for safety
 *
 * @param vibeText - User-provided vibe text
 * @returns Sanitized text or neutral fallback if blocked content detected
 */
export function scrubVibeText(vibeText: string | undefined | null): string {
  // If no text provided, return neutral fallback
  if (!vibeText || vibeText.trim().length === 0) {
    return NEUTRAL_FALLBACK_TEXT;
  }

  // Check for blocked content
  if (containsBlockedContent(vibeText)) {
    console.warn(
      "Blocked content detected in vibe text (content not logged for privacy)"
    );
    return NEUTRAL_FALLBACK_TEXT;
  }

  // Return sanitized text (trimmed and length-limited)
  const sanitized = vibeText.trim();
  const maxLength = 200;

  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * Validate vibe text and return result with reason if blocked
 *
 * @param vibeText - User-provided vibe text
 * @returns Validation result with reason if blocked
 */
export function validateVibeText(vibeText: string | undefined | null): {
  isValid: boolean;
  reason?: string;
  sanitized: string;
} {
  if (!vibeText || vibeText.trim().length === 0) {
    return {
      isValid: true,
      sanitized: NEUTRAL_FALLBACK_TEXT,
    };
  }

  if (containsBlockedContent(vibeText)) {
    return {
      isValid: false,
      reason:
        "Text contains prohibited content. Please avoid references to illegal activities, weapons, minors, or medical claims.",
      sanitized: NEUTRAL_FALLBACK_TEXT,
    };
  }

  const sanitized = vibeText.trim();
  const maxLength = 200;

  if (sanitized.length > maxLength) {
    return {
      isValid: true,
      sanitized: sanitized.substring(0, maxLength).trim(),
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}
