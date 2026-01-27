import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getAtoFilesByAtoId,
  getEnabledAtoFilesByAtoId,
  getUnofficialAtoById,
} from "@/lib/db/queries";

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: atoId } = await params;

  if (!atoId) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const ato = await getUnofficialAtoById({
    id: atoId,
    ownerUserId: session.user.id,
  });

  if (!ato) {
    return NextResponse.json({ error: "ATO not found." }, { status: 404 });
  }

  const enabledOnly = request.nextUrl.searchParams.get("enabled") === "true";
  const files = enabledOnly
    ? await getEnabledAtoFilesByAtoId({
        atoId,
        ownerUserId: session.user.id,
      })
    : await getAtoFilesByAtoId({ atoId, ownerUserId: session.user.id });

  return NextResponse.json({ files });
}
