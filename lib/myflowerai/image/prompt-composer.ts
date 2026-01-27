/**
 * MyFlowerAI Image Generation Prompt Composer
 *
 * Composes prompts for strain-based image generation with art-only constraints.
 * Enforces safety requirements: abstract/psychedelic art only, no medical claims,
 * no branding, no minors, no illegal activities, no real persons, no photoreal packaging.
 */

import type { StrainMeaning } from "../tagger";
import { scrubVibeText } from "./safety";

/**
 * Maximum prompt length for OpenAI DALL-E API
 */
const MAX_PROMPT_LENGTH = 1000;

/**
 * Persona profile for image generation
 */
export interface PersonaProfile {
  persona_id: string;
  display_name: string;
  vibe_summary?: string;
  image_style_keywords?: string[];
}

/**
 * Vibe settings for image generation
 */
export interface VibeSettings {
  intensity?: number; // 0-10, default 5
  neon?: number; // 0-10, default 0
  nature?: number; // 0-10, default 5
  surreal?: number; // 0-10, default 5
  chaos?: number; // 0-10 (0=calm, 10=chaotic), default 5
}

/**
 * Image generation preset
 */
export interface ImagePreset {
  id: string;
  name: string;
  description: string;
  style_keywords: string[];
  vibe_settings: VibeSettings;
}

/**
 * Strain data for prompt composition
 */
export interface StrainData {
  strain: {
    name: string;
    type: string;
  };
  meaning?: StrainMeaning;
  stats?: {
    top_terpenes?: Array<{ name: string; percent: number }>;
  };
}

/**
 * Convert vibe settings to descriptive text
 */
function vibeSettingsToText(settings: VibeSettings): string {
  const parts: string[] = [];

  // Intensity
  const intensity = settings.intensity ?? 5;
  if (intensity <= 3) {
    parts.push("subtle and gentle");
  } else if (intensity >= 7) {
    parts.push("bold and vivid");
  } else {
    parts.push("balanced");
  }

  // Neon
  const neon = settings.neon ?? 0;
  if (neon >= 7) {
    parts.push("neon glowing colors");
  } else if (neon >= 4) {
    parts.push("luminous accents");
  }

  // Nature
  const nature = settings.nature ?? 5;
  if (nature >= 7) {
    parts.push("organic natural forms");
  } else if (nature <= 3) {
    parts.push("geometric abstract shapes");
  } else {
    parts.push("flowing organic patterns");
  }

  // Surreal
  const surreal = settings.surreal ?? 5;
  if (surreal >= 7) {
    parts.push("dreamlike surrealism");
  } else if (surreal <= 3) {
    parts.push("structured composition");
  } else {
    parts.push("artistic interpretation");
  }

  // Chaos vs Calm
  const chaos = settings.chaos ?? 5;
  if (chaos >= 7) {
    parts.push("dynamic chaotic energy");
  } else if (chaos <= 3) {
    parts.push("peaceful tranquil atmosphere");
  } else {
    parts.push("harmonious balance");
  }

  return parts.join(", ");
}

/**
 * Compose a safe, art-focused prompt for image generation
 *
 * @param strainData - Strain information including meaning tags
 * @param personaProfile - Optional persona profile for style guidance
 * @param vibeSettings - Optional vibe slider settings
 * @param userVibeText - Optional user-provided vibe text (will be sanitized)
 * @param preset - Optional image preset with style keywords
 * @returns Composed prompt string for image generation
 */
export function composeImagePrompt(
  strainData: StrainData,
  personaProfile?: PersonaProfile,
  vibeSettings?: VibeSettings,
  userVibeText?: string,
  preset?: ImagePreset
): string {
  const parts: string[] = [];

  // Start with art style constraint
  parts.push("Abstract psychedelic art:");

  // Add preset style keywords if provided (takes precedence for style direction)
  if (preset?.style_keywords && preset.style_keywords.length > 0) {
    parts.push(preset.style_keywords.join(", "));
  }

  // Add strain type influence
  const strainType = strainData.strain.type.toLowerCase();
  if (strainType === "sativa") {
    parts.push("energetic upward flowing patterns");
  } else if (strainType === "indica") {
    parts.push("deep relaxing waves and soft gradients");
  } else {
    parts.push("balanced harmonious composition");
  }

  // Add aroma/flavor visual representations
  if (
    strainData.meaning?.aroma_flavor_tags &&
    strainData.meaning.aroma_flavor_tags.length > 0
  ) {
    const aromas = strainData.meaning.aroma_flavor_tags.slice(0, 3);
    const aromaDescriptions = aromas.map((tag) => {
      // Map aroma tags to visual concepts (no literal items)
      const aromaMap: Record<string, string> = {
        citrus: "bright yellow-orange swirls",
        lemon: "sharp geometric light patterns",
        orange: "warm glowing orbs",
        pine: "deep green flowing lines",
        floral: "soft pink and purple gradients",
        lavender: "gentle violet wisps",
        earthy: "rich brown textures",
        woody: "organic branching forms",
        spicy: "warm red angular patterns",
        sweet: "pastel dreamy clouds",
        herbal: "emerald green fractals",
        berry: "deep magenta bursts",
        fruit: "vibrant multicolor splashes",
        mint: "cool cyan waves",
        pepper: "sharp contrast edges",
      };
      return aromaMap[tag] || `${tag}-inspired abstract forms`;
    });
    parts.push(aromaDescriptions.join(", "));
  }

  // Add effect-based mood
  if (
    strainData.meaning?.effect_tags &&
    strainData.meaning.effect_tags.length > 0
  ) {
    const effects = strainData.meaning.effect_tags.slice(0, 3);
    const effectDescriptions = effects.map((tag) => {
      // Map effect tags to visual moods (no medical claims)
      const effectMap: Record<string, string> = {
        uplifting: "ascending spirals",
        energizing: "radiating bursts of light",
        relaxing: "gentle flowing waves",
        calming: "soft rippling water-like patterns",
        "mood-enhancing": "warm glowing gradients",
        focus: "sharp converging lines",
        creative: "imaginative abstract shapes",
        sedating: "deep slow-moving forms",
        "stress-relief": "smooth dissolving boundaries",
        social: "interconnected organic patterns",
      };
      return effectMap[tag] || `${tag}-inspired atmosphere`;
    });
    parts.push(effectDescriptions.join(", "));
  }

  // Add persona style if provided (and not overridden by preset)
  if (
    !preset &&
    personaProfile?.image_style_keywords &&
    personaProfile.image_style_keywords.length > 0
  ) {
    const keywords = personaProfile.image_style_keywords.slice(0, 2);
    parts.push(keywords.join(", "));
  }

  // Add vibe settings (use preset settings if provided, otherwise use manual settings)
  const effectiveVibeSettings = preset?.vibe_settings || vibeSettings;
  if (effectiveVibeSettings) {
    const vibeText = vibeSettingsToText(effectiveVibeSettings);
    parts.push(vibeText);
  }

  // Add sanitized user vibe text
  if (userVibeText) {
    const sanitized = scrubVibeText(userVibeText);
    parts.push(sanitized);
  }

  // Add mandatory art-only constraints
  const constraints = [
    "No text, no labels, no branding",
    "No people, no faces, no body parts",
    "No product packaging, no bottles, no containers",
    "No realistic cannabis plants or leaves",
    "Pure abstract art only",
  ];
  parts.push(constraints.join(". "));

  // Join all parts
  const prompt = parts.join(". ");

  // Ensure prompt doesn't exceed maximum length
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `${prompt.substring(0, MAX_PROMPT_LENGTH).trim()}...`;
  }

  return prompt;
}

/**
 * Generate a short title/description for the generated image
 *
 * @param strainData - Strain information
 * @param personaProfile - Optional persona profile
 * @returns Short descriptive title
 */
export function generateImageTitle(
  strainData: StrainData,
  personaProfile?: PersonaProfile
): string {
  const strainName = strainData.strain.name;
  const strainType = strainData.strain.type;

  if (personaProfile) {
    return `${strainName} (${strainType}) - ${personaProfile.display_name} Vibe`;
  }

  return `${strainName} (${strainType}) - Abstract Art`;
}

/**
 * Validate that a composed prompt meets safety requirements
 *
 * @param prompt - Composed prompt to validate
 * @returns Validation result
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for forbidden content patterns
  const forbiddenPatterns = [
    {
      pattern: /\b(person|people|face|man|woman|child|kid)\b/i,
      issue: "Contains references to people",
    },
    {
      pattern: /\b(bottle|package|container|box|jar|bag)\b/i,
      issue: "Contains product packaging references",
    },
    {
      pattern:
        /\b(cannabis|marijuana|weed|pot|bud|flower)\s+(plant|leaf|leaves)\b/i,
      issue: "Contains realistic plant references",
    },
    {
      pattern: /\b(brand|logo|trademark|company)\b/i,
      issue: "Contains branding references",
    },
    {
      pattern: /\b(cure|treat|medicine|medical|prescription)\b/i,
      issue: "Contains medical claims",
    },
  ];

  for (const { pattern, issue } of forbiddenPatterns) {
    if (pattern.test(prompt)) {
      issues.push(issue);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
