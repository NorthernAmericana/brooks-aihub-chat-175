import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * API route to serve MyFlowerAI image generation presets
 * GET /api/myflowerai/presets
 */
export async function GET() {
  try {
    const presetsFilePath = path.join(
      process.cwd(),
      "data",
      "myflowerai",
      "image-presets.json"
    );

    const fileContent = await fs.readFile(presetsFilePath, "utf-8");
    const presetsData = JSON.parse(fileContent);

    return NextResponse.json(presetsData);
  } catch (error) {
    console.error("Error loading presets:", error);
    return NextResponse.json(
      { error: "Failed to load presets" },
      { status: 500 }
    );
  }
}
