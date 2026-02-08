import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteUnofficialAto,
  getUnofficialAtoByRoute,
  getUnofficialAtoById,
  getUserById,
  listRouteRegistryEntries,
  updateUnofficialAtoSettings,
} from "@/lib/db/queries";
import { normalizeRouteKey, sanitizeRouteSegment } from "@/lib/routes/utils";

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

const formatAtoRoute = (value: string) => sanitizeRouteSegment(value);

const normalizeAtoRoute = (value: string) => normalizeRouteKey(value);

const isReservedAtoRoute = async (normalizedRoute: string) => {
  const routes = await listRouteRegistryEntries();
  return routes.some(
    (route) => normalizeRouteKey(route.slash) === normalizedRoute
  );
};

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
    name?: string | null;
    description?: string | null;
    route?: string | null;
    defaultVoiceId?: string | null;
    defaultVoiceLabel?: string | null;
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
  const hasDetailsUpdate =
    typeof payload.name === "string" ||
    typeof payload.description === "string" ||
    payload.description === null ||
    typeof payload.route === "string" ||
    typeof payload.defaultVoiceId === "string" ||
    typeof payload.defaultVoiceLabel === "string";
  const hasPersonalityUpdate =
    typeof payload.personalityName === "string" ||
    payload.personalityName === null ||
    typeof payload.instructions === "string" ||
    payload.instructions === null;

  if (!hasSettingsUpdate && !hasDetailsUpdate && !hasPersonalityUpdate) {
    return NextResponse.json(
      { error: "No settings provided." },
      { status: 400 }
    );
  }

  const nameValue =
    typeof payload.name === "string" ? payload.name.trim() : undefined;

  if (typeof nameValue !== "undefined" && !nameValue) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const descriptionValue =
    typeof payload.description === "string"
      ? payload.description.trim() || null
      : payload.description === null
        ? null
        : undefined;

  const rawRoute = typeof payload.route === "string" ? payload.route : undefined;
  const formattedRoute =
    typeof rawRoute === "string" ? formatAtoRoute(rawRoute) : undefined;
  const normalizedRoute =
    typeof formattedRoute === "string"
      ? normalizeAtoRoute(formattedRoute)
      : undefined;

  if (typeof formattedRoute === "string" && !formattedRoute) {
    return NextResponse.json(
      { error: "slash route is required." },
      { status: 400 }
    );
  }

  if (typeof normalizedRoute === "string" && !normalizedRoute) {
    return NextResponse.json(
      { error: "slash route is required." },
      { status: 400 }
    );
  }

  if (
    typeof normalizedRoute === "string" &&
    (await isReservedAtoRoute(normalizedRoute))
  ) {
    return NextResponse.json(
      { error: "Slash route conflicts with an existing ATO." },
      { status: 400 }
    );
  }

  if (typeof formattedRoute === "string") {
    const existingRoute = await getUnofficialAtoByRoute({
      ownerUserId: session.user.id,
      route: formattedRoute,
    });

    if (existingRoute && existingRoute.id !== atoId) {
      return NextResponse.json(
        { error: "Slash route is already in use." },
        { status: 400 }
      );
    }
  }

  const instructionsValue =
    typeof payload.instructions === "string"
      ? payload.instructions.trim()
      : payload.instructions === null
        ? null
        : undefined;

  if (typeof instructionsValue === "string") {
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

  const personalityValue =
    typeof payload.personalityName === "string"
      ? payload.personalityName.trim() || null
      : payload.personalityName === null
        ? null
        : undefined;

  const updated = await updateUnofficialAtoSettings({
    id: atoId,
    ownerUserId: session.user.id,
    webSearchEnabled: payload.webSearchEnabled,
    fileSearchEnabled: payload.fileSearchEnabled,
    name: nameValue,
    description: descriptionValue,
    route: typeof formattedRoute === "string" ? formattedRoute : undefined,
    defaultVoiceId:
      typeof payload.defaultVoiceId === "string"
        ? payload.defaultVoiceId
        : undefined,
    defaultVoiceLabel:
      typeof payload.defaultVoiceLabel === "string"
        ? payload.defaultVoiceLabel
        : undefined,
    personalityName: personalityValue,
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

export async function DELETE(
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

  const deleted = await deleteUnofficialAto({
    id: atoId,
    ownerUserId: session.user.id,
  });

  if (!deleted) {
    return NextResponse.json({ error: "ATO not found." }, { status: 404 });
  }

  return NextResponse.json({ ato: deleted });
}
