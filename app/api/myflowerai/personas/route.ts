import { NextResponse } from "next/server";
import { loadPersonas } from "@/lib/myflowerai/personas/load-personas";

export async function GET() {
  try {
    const personas = await loadPersonas();
    return NextResponse.json({ personas });
  } catch {
    return NextResponse.json(
      { error: "Failed to load persona dataset" },
      { status: 500 }
    );
  }
}
