import { NextResponse } from "next/server";
import { loadStrains } from "@/lib/myflowerai/strains/load-strains";

export async function GET() {
  try {
    const strains = await loadStrains();
    return NextResponse.json({ strains });
  } catch {
    return NextResponse.json(
      { error: "Failed to load strain dataset" },
      { status: 500 }
    );
  }
}
