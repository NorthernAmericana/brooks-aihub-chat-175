import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getUnofficialAtoById,
  updateUnofficialAtoSettings,
} from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
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

  return NextResponse.json({ ato });
}

export async function PATCH(
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

  let payload: {
    webSearchEnabled?: boolean;
    fileSearchEnabled?: boolean;
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (
    typeof payload.webSearchEnabled !== "boolean" &&
    typeof payload.fileSearchEnabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "No settings provided." },
      { status: 400 }
    );
  }

  const updated = await updateUnofficialAtoSettings({
    id: atoId,
    ownerUserId: session.user.id,
    webSearchEnabled: payload.webSearchEnabled,
    fileSearchEnabled: payload.fileSearchEnabled,
  });

  if (!updated) {
    return NextResponse.json({ error: "ATO not found." }, { status: 404 });
  }

  return NextResponse.json({ ato: updated });
}
