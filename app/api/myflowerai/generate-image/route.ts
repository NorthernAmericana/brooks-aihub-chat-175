import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  composeImagePrompt,
  generateImageTitle,
  type PersonaProfile,
} from "@/lib/myflowerai/image/prompt-composer";
import { validateVibeText } from "@/lib/myflowerai/image/safety";

/**
 * API route for MyFlowerAI strain-based image generation
 *
 * POST /api/myflowerai/generate-image
 * Body: {
 *   strain_id: string,
 *   persona_id?: string,
 *   vibe_settings?: VibeSettings,
 *   user_vibe_text?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strain_id, persona_id, vibe_settings, user_vibe_text } = body;

    // Validate required fields
    if (!strain_id) {
      return NextResponse.json(
        { error: "strain_id is required" },
        { status: 400 }
      );
    }

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
      personaProfile = await loadPersonaData(persona_id);
      if (!personaProfile) {
        console.warn(
          `Persona not found: ${persona_id}, continuing without persona`
        );
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
      sanitizedVibeText
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
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: "Image generation failed",
          details: errorData.error?.message || "Unknown error",
        },
        { status: openaiResponse.status }
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
