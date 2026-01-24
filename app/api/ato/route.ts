import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createUnofficialAto,
  getUnofficialAtosByOwner,
} from "@/lib/db/queries";

const allowedIntelligenceModes = ["Hive", "ATO-Limited"] as const;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const atos = await getUnofficialAtosByOwner({
    ownerUserId: session.user.id,
  });

  return NextResponse.json({ atos });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: {
    name?: string;
    description?: string | null;
    personalityName?: string | null;
    instructions?: string | null;
    intelligenceMode?: (typeof allowedIntelligenceModes)[number];
    defaultVoiceId?: string | null;
    defaultVoiceLabel?: string | null;
    webSearchEnabled?: boolean;
    fileSearchEnabled?: boolean;
    planMetadata?: Record<string, unknown> | null;
  };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  if (
    payload.intelligenceMode &&
    !allowedIntelligenceModes.includes(payload.intelligenceMode)
  ) {
    return NextResponse.json(
      { error: "Invalid intelligence mode." },
      { status: 400 }
    );
  }

  const ato = await createUnofficialAto({
    ownerUserId: session.user.id,
    name,
    description:
      typeof payload.description === "string" ? payload.description : null,
    personalityName:
      typeof payload.personalityName === "string"
        ? payload.personalityName
        : null,
    instructions:
      typeof payload.instructions === "string" ? payload.instructions : null,
    intelligenceMode: payload.intelligenceMode,
    defaultVoiceId:
      typeof payload.defaultVoiceId === "string" ? payload.defaultVoiceId : null,
    defaultVoiceLabel:
      typeof payload.defaultVoiceLabel === "string"
        ? payload.defaultVoiceLabel
        : null,
    webSearchEnabled:
      typeof payload.webSearchEnabled === "boolean"
        ? payload.webSearchEnabled
        : undefined,
    fileSearchEnabled:
      typeof payload.fileSearchEnabled === "boolean"
        ? payload.fileSearchEnabled
        : undefined,
    planMetadata:
      payload.planMetadata &&
      typeof payload.planMetadata === "object" &&
      !Array.isArray(payload.planMetadata)
        ? payload.planMetadata
        : null,
  });

  if (!ato) {
    return NextResponse.json(
      { error: "Failed to create ATO." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ato }, { status: 201 });
}
