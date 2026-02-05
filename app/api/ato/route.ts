import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createCustomAtoWithInstall,
  getUnofficialAtoCountByOwner,
  getUnofficialAtoByRoute,
  getUnofficialAtosByOwner,
  getUserById,
  listRouteRegistryEntries,
} from "@/lib/db/queries";
import { normalizeRouteKey, sanitizeRouteSegment } from "@/lib/routes/utils";

const allowedIntelligenceModes = ["Hive", "ATO-Limited"] as const;

const formatAtoRoute = (value: string) => sanitizeRouteSegment(value);

const normalizeAtoRoute = (value: string) => normalizeRouteKey(value);

const isReservedAtoRoute = async (normalizedRoute: string) => {
  const routes = await listRouteRegistryEntries();
  return routes.some(
    (route) => normalizeRouteKey(route.slash) === normalizedRoute
  );
};

// Force dynamic rendering to prevent prerendering issues with auth()
export const dynamic = "force-dynamic";

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
    route?: string | null;
    description?: string | null;
    personalityName?: string | null;
    instructions?: string | null;
    intelligenceMode?: (typeof allowedIntelligenceModes)[number];
    defaultVoiceId?: string | null;
    defaultVoiceLabel?: string | null;
    webSearchEnabled?: boolean;
    fileSearchEnabled?: boolean;
    fileUsageEnabled?: boolean;
    planMetadata?: Record<string, unknown> | null;
    hasAvatar?: boolean;
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

  const rawRoute = typeof payload.route === "string" ? payload.route : "";
  const formattedRoute = formatAtoRoute(rawRoute || name);
  const normalizedRoute = normalizeAtoRoute(formattedRoute);

  if (!formattedRoute || !normalizedRoute) {
    return NextResponse.json(
      { error: "slash route is required." },
      { status: 400 }
    );
  }

  if (await isReservedAtoRoute(normalizedRoute)) {
    return NextResponse.json(
      { error: "Slash route conflicts with an existing ATO." },
      { status: 400 }
    );
  }

  const existingRoute = await getUnofficialAtoByRoute({
    ownerUserId: session.user.id,
    route: formattedRoute,
  });

  if (existingRoute) {
    return NextResponse.json(
      { error: "Slash route is already in use." },
      { status: 400 }
    );
  }

  const user = await getUserById({ id: session.user.id });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const hasFoundersAccess = Boolean(user.foundersAccess);
  const hasAvatar = payload.hasAvatar === true;

  if (hasAvatar && !hasFoundersAccess) {
    return NextResponse.json(
      { error: "Avatar pairing currently requires Founders access." },
      { status: 403 }
    );
  }

  const instructionsValue =
    typeof payload.instructions === "string" ? payload.instructions.trim() : "";
  const instructionsLimit = hasFoundersAccess ? 999 : 500;

  if (instructionsValue.length > instructionsLimit) {
    return NextResponse.json(
      {
        error: `Instructions must be ${instructionsLimit} characters or fewer.`,
      },
      { status: 400 }
    );
  }

  if (hasFoundersAccess) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const monthlyCount = await getUnofficialAtoCountByOwner({
      ownerUserId: session.user.id,
      createdAfter: monthStart,
    });

    if (monthlyCount >= 10) {
      return NextResponse.json(
        {
          error:
            "Founders members can create up to 10 unofficial ATOs per month.",
        },
        { status: 403 }
      );
    }
  } else {
    const totalCount = await getUnofficialAtoCountByOwner({
      ownerUserId: session.user.id,
    });

    if (totalCount >= 3) {
      return NextResponse.json(
        {
          error:
            "Free accounts can create up to 3 unofficial ATOs. Upgrade to Founders for more.",
        },
        { status: 403 }
      );
    }
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

  const created = await createCustomAtoWithInstall({
    ownerUserId: session.user.id,
    name,
    route: formattedRoute,
    description:
      typeof payload.description === "string" ? payload.description : null,
    personalityName:
      typeof payload.personalityName === "string"
        ? payload.personalityName
        : null,
    instructions:
      typeof payload.instructions === "string"
        ? payload.instructions.trim()
        : null,
    hasAvatar,
  });

  if (!created?.customAto) {
    return NextResponse.json(
      { error: "Failed to create ATO." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ato: {
        id: created.customAto.id,
        name: created.customAto.name,
        route: created.customAto.route,
        hasAvatar: created.customAto.hasAvatar,
      },
    },
    { status: 201 }
  );
}
