import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  composeImagePrompt,
  generateImageTitle,
  type PersonaProfile,
  type ImagePreset,
} from "@/lib/myflowerai/image/prompt-composer";
import { validateVibeText } from "@/lib/myflowerai/image/safety";

/**
 * Image generation configuration
 */
const IMAGE_CONFIG = {
  model: process.env.DALLE_MODEL || "dall-e-3",
  size:
    (process.env.DALLE_SIZE as "1024x1024" | "1792x1024" | "1024x1792") ||
    "1024x1024",
  quality: (process.env.DALLE_QUALITY as "standard" | "hd") || "standard",
  response_format: "url" as const,
} as const;

/**
 * API route for MyFlowerAI strain-based image generation
 *
 * POST /api/myflowerai/generate-image
 * Body: {
 *   strain_id: string,
 *   persona_id?: string,
 *   preset_id?: string,
 *   vibe_settings?: VibeSettings,
 *   user_vibe_text?: string,
 *   storage_key?: string,         // Vercel Blob pathname for reference image
 *   reference_image_url?: string  // Direct Vercel Blob URL for reference image
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      strain_id,
      persona_id,
      preset_id,
      vibe_settings,
      user_vibe_text,
      storage_key,
      reference_image_url,
    } = body;

    // Validate required fields
    if (!strain_id) {
      return NextResponse.json(
        { error: "strain_id is required" },
        { status: 400 }
      );
    }

    // Determine if we have a reference image
    const hasReferenceImage = !!(storage_key || reference_image_url);

    // Load strain data
    const strainData = await loadStrainData(strain_id);
    if (!strainData) {
      return NextResponse.json(
        { error: `Strain not found: ${strain_id}` },
        { status: 404 }
      );
    }

    // Load persona data if provided
    let personaProfile: PersonaProfile | undefined;
    if (persona_id) {
      const loadedPersona = await loadPersonaData(persona_id);
      if (!loadedPersona) {
        console.warn(
          `Persona not found: ${persona_id}, continuing without persona`
        );
      } else {
        personaProfile = loadedPersona;
      }
    }

    // Load preset data if provided
    let preset: ImagePreset | undefined;
    if (preset_id) {
      const loadedPreset = await loadPresetData(preset_id);
      if (!loadedPreset) {
        console.warn(
          `Preset not found: ${preset_id}, continuing without preset`
        );
      } else {
        preset = loadedPreset;
      }
    }

    // Validate user vibe text if provided
    let sanitizedVibeText: string | undefined;
    if (user_vibe_text) {
      const validation = validateVibeText(user_vibe_text);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Invalid vibe text",
            reason: validation.reason,
            using_fallback: true,
          },
          { status: 400 }
        );
      }
      sanitizedVibeText = validation.sanitized;
    }

    // Compose the prompt
    const prompt = composeImagePrompt(
      strainData,
      personaProfile,
      vibe_settings,
      sanitizedVibeText,
      preset,
      hasReferenceImage
    );

    // Generate image title
    const title = generateImageTitle(strainData, personaProfile);

    // Note: DALL-E 3 doesn't support image-to-image generation directly
    // The reference image is used conceptually through enhanced text prompts
    // that guide the AI to create abstract interpretations
    // Future enhancement: Integrate vision API to analyze uploaded image
    // and extract specific color/mood information to enhance prompts
    if (hasReferenceImage) {
      console.log(
        "Reference image mode enabled - using enhanced prompt with style transfer guidance"
      );
      if (storage_key) {
        console.log(`Reference image storage key: ${storage_key}`);
      }
      if (reference_image_url) {
        console.log(`Reference image URL provided: ${reference_image_url}`);
      }
    }

    // Call OpenAI DALL-E for image generation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: IMAGE_CONFIG.model,
          prompt,
          n: 1,
          size: IMAGE_CONFIG.size,
          quality: IMAGE_CONFIG.quality,
          response_format: IMAGE_CONFIG.response_format,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error(
        `OpenAI API error: status=${openaiResponse.status}, message=${errorData.error?.message || "Unknown"}`
      );

      // Map OpenAI error codes to appropriate HTTP status codes
      const statusCode =
        openaiResponse.status === 400 ||
        errorData.error?.code === "content_policy_violation"
          ? 400
          : 502;

      return NextResponse.json(
        {
          error: "Image generation failed",
          details: errorData.error?.message || "Unknown error",
        },
        { status: statusCode }
      );
    }

    const data = await openaiResponse.json();

    // Return the result
    return NextResponse.json({
      success: true,
      image_url: data.data[0].url,
      title,
      prompt_used: prompt,
      strain: {
        id: strain_id,
        name: strainData.strain.name,
        type: strainData.strain.type,
      },
      persona: personaProfile
        ? {
            id: persona_id,
            name: personaProfile.display_name,
          }
        : undefined,
      has_reference_image: hasReferenceImage,
    });
  } catch (error) {
    console.error("Error in generate-image API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Load strain data from file system
 */
async function loadStrainData(strainId: string) {
  try {
    const strainsDir = path.join(
      process.cwd(),
      "data",
      "myflowerai",
      "strains"
    );
    const filePath = path.join(strainsDir, `${strainId}.json`);

    const fileContent = await fs.readFile(filePath, "utf-8");
    const strainData = JSON.parse(fileContent);

    return strainData;
  } catch (error) {
    console.error(`Error loading strain ${strainId}:`, error);
    return null;
  }
}

/**
 * Load persona data from file system
 */
async function loadPersonaData(
  personaId: string
): Promise<PersonaProfile | null> {
  try {
    const personasDir = path.join(
      process.cwd(),
      "data",
      "myflowerai",
      "personas"
    );
    const filePath = path.join(personasDir, `${personaId}.json`);

    const fileContent = await fs.readFile(filePath, "utf-8");
    const personaData = JSON.parse(fileContent);

    return personaData;
  } catch (error) {
    console.error(`Error loading persona ${personaId}:`, error);
    return null;
  }
}

/**
 * Load preset data from file system
 */
async function loadPresetData(
  presetId: string
): Promise<ImagePreset | null> {
  try {
    const presetsFilePath = path.join(
      process.cwd(),
      "data",
      "myflowerai",
      "image-presets.json"
    );

    const fileContent = await fs.readFile(presetsFilePath, "utf-8");
    const presetsData = JSON.parse(fileContent);

    // Find the preset by id
    const preset = presetsData.presets.find(
      (p: ImagePreset) => p.id === presetId
    );

    return preset || null;
  } catch (error) {
    console.error(`Error loading preset ${presetId}:`, error);
    return null;
  }
}
