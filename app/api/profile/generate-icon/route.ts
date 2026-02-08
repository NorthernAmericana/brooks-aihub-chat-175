import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { put } from "@vercel/blob";

const IMAGE_CONFIG = {
  model: process.env.DALLE_MODEL || "dall-e-3",
  size:
    (process.env.DALLE_SIZE as "1024x1024" | "1792x1024" | "1024x1792") ||
    "1024x1024",
  quality: (process.env.DALLE_QUALITY as "standard" | "hd") || "standard",
  response_format: "url" as const,
} as const;

const PLACEHOLDER_IMAGE_URL =
  "https://placehold.co/1024x1024.png?text=Profile+Icon";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: { prompt?: string; style?: string } | null = null;

  try {
    body = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  const prompt = body.prompt.trim();
  const style = typeof body.style === "string" ? body.style.trim() : "";
  const fullPrompt = `Create a square profile icon with a clean background. ${prompt}${style ? ` Style: ${style}.` : ""}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // TODO: replace mock fallback once OPENAI_API_KEY is configured.
    return NextResponse.json({
      success: true,
      image_url: PLACEHOLDER_IMAGE_URL,
      storage_key: null,
      placeholder: true,
    });
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
        prompt: fullPrompt,
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
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image generation returned no image" },
      { status: 502 }
    );
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch generated image" },
      { status: 502 }
    );
  }

  const imageBlob = await imageResponse.blob();
  const filename = `avatars/${session.user.id}/${Date.now()}.png`;
  const blob = await put(filename, imageBlob, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return NextResponse.json({
    success: true,
    image_url: blob.url,
    storage_key: blob.pathname,
    prompt_used: fullPrompt,
  });
}
