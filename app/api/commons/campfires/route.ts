import { NextResponse } from "next/server";
import { listCampfires } from "@/lib/db/commons-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const campfires = await listCampfires();
  return NextResponse.json({ campfires });
}
