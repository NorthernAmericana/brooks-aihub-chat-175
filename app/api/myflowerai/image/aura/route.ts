import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { myfloweraiImages } from "@/lib/db/schema";
import { put } from "@vercel/blob";
import {
  composeImagePrompt,
  generateImageTitle,
  type PersonaProfile,
  type ImagePreset,
} from "@/lib/myflowerai/image/prompt-composer";
import { validateVibeText } from "@/lib/myflowerai/image/safety";
import { ensureStrainMeaning } from "@/lib/myflowerai/strain/meaning";

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
 * API route for MyFlowerAI Strain Aura image generation
 *
 * POST /api/myflowerai/image/aura
 * Body: {
 *   persona_id: string (required),
 *   strain_id?: string (optional),
 *   preset_id?: string,
 *   vibe_settings?: VibeSettings,
 *   user_vibe_text?: string
 * }
 *
 * Generates abstract psychedelic art based on quiz persona with optional strain
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      persona_id,
      strain_id,
      preset_id,
      vibe_settings,
      user_vibe_text,
    } = body;

    // Validate required fields (persona is required, strain is optional)
    if (!persona_id) {
      return NextResponse.json(
        { error: "persona_id is required" },
        { status: 400 }
      );
    }

    // Load persona data (required)
    const personaProfile = await loadPersonaData(persona_id);
    if (!personaProfile) {
      return NextResponse.json(
        { error: `Persona not found: ${persona_id}` },
        { status: 404 }
      );
    }

    // Load strain data (optional)
    let strainData = null;
    if (strain_id) {
      strainData = await loadStrainData(strain_id);
      if (!strainData) {
        return NextResponse.json(
          { error: `Strain not found: ${strain_id}` },
          { status: 404 }
        );
      }
      // Ensure strain has meaning tags
      strainData = ensureStrainMeaning(strainData);
    } else {
      // Persona-only mode: create a synthetic strain from persona tags
      const personaTags = [
        ...(personaProfile.tag_profile?.primary_tags || []),
        ...(personaProfile.tag_profile?.secondary_tags || []),
      ];

      strainData = {
        strain: {
          name: personaProfile.display_name,
          type: "hybrid", // Neutral type for persona-only
        },
        meaning: {
          effect_tags: personaTags.slice(0, 5),
          aroma_flavor_tags: [],
          dominant_terpenes: [],
          minor_cannabinoids_present: [],
          disclaimers: [],
        },
      };
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
      false // No reference image support in aura mode
    );

    // Generate image title
    const title = generateImageTitle(strainData, personaProfile);

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
    const imageUrl = data.data[0].url;

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Store image in Vercel Blob (private storage)
    const filename = `myflowerai/aura/${session.user.id}/${Date.now()}.png`;
    const blob = await put(filename, imageBlob, {
      access: "public", // Note: Can be changed to 'private' with appropriate access controls
      addRandomSuffix: false,
    });

    // Store metadata in database
    const currentDate = new Date();
    const createdMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    await db.insert(myfloweraiImages).values({
      userId: session.user.id,
      personaId: persona_id,
      strainId: strain_id || null,
      presetId: preset_id || null,
      storageKey: blob.pathname, // Store pathname, not full URL
      createdMonth,
    });

    // Return the result
    return NextResponse.json({
      success: true,
      image_storage_key: blob.pathname,
      image_url: blob.url,
      title,
      prompt_metadata_safe: {
        persona_id,
        strain_id: strain_id || null,
        preset_id: preset_id || null,
      },
    });
  } catch (error) {
    console.error("Error in aura image generation API:", error);
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

    // Map persona data to PersonaProfile format
    return {
      persona_id: personaData.persona_id,
      display_name: personaData.display_name,
      vibe_summary: personaData.vibe_summary,
      image_style_keywords: personaData.image_style_keywords,
      tag_profile: personaData.tag_profile,
    };
  } catch (error) {
    console.error(`Error loading persona ${personaId}:`, error);
    return null;
  }
}

/**
 * Load preset data from file system
 */
async function loadPresetData(presetId: string): Promise<ImagePreset | null> {
  try {
    const presetsPath = path.join(
      process.cwd(),
      "data",
      "myflowerai",
      "image-presets.json"
    );

    const fileContent = await fs.readFile(presetsPath, "utf-8");
    const presetsData = JSON.parse(fileContent);

    // Find preset by ID
    const preset = presetsData.presets.find(
      (p: ImagePreset) => p.id === presetId
    );

    return preset || null;
  } catch (error) {
    console.error(`Error loading preset ${presetId}:`, error);
    return null;
  }
}
