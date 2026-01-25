import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getUserById,
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
    personalityName?: string | null;
    instructions?: string | null;
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const hasSettingsUpdate =
    typeof payload.webSearchEnabled === "boolean" ||
    typeof payload.fileSearchEnabled === "boolean";
  const hasPersonalityUpdate =
    typeof payload.personalityName === "string" ||
    typeof payload.instructions === "string";

  if (!hasSettingsUpdate && !hasPersonalityUpdate) {
    return NextResponse.json(
      { error: "No settings provided." },
      { status: 400 }
    );
  }

  const instructionsValue =
    typeof payload.instructions === "string"
      ? payload.instructions.trim()
      : undefined;

  if (typeof instructionsValue !== "undefined") {
    const user = await getUserById({ id: session.user.id });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const instructionsLimit = user.foundersAccess ? 999 : 500;

    if (instructionsValue.length > instructionsLimit) {
      return NextResponse.json(
        {
          error: `Instructions must be ${instructionsLimit} characters or fewer.`,
        },
        { status: 400 }
      );
    }
  }

  const updated = await updateUnofficialAtoSettings({
    id: atoId,
    ownerUserId: session.user.id,
    webSearchEnabled: payload.webSearchEnabled,
    fileSearchEnabled: payload.fileSearchEnabled,
    personalityName:
      typeof payload.personalityName === "string"
        ? payload.personalityName.trim() || null
        : undefined,
    instructions:
      typeof instructionsValue !== "undefined"
        ? instructionsValue || null
        : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "ATO not found." }, { status: 404 });
  }

  return NextResponse.json({ ato: updated });
}
