import { NextResponse, type NextRequest } from "next/server";
import { normalizeRouteKey, sanitizeRouteSegment } from "@/lib/routes/utils";

const allowedIntelligenceModes = ["Hive", "ATO-Limited"] as const;
const formatAtoRoute = (value: string) => sanitizeRouteSegment(value);
const normalizeAtoRoute = (value: string) => normalizeRouteKey(value);

type Session = { user?: { id?: string | null } | null } | null;

export type CreateAtoDeps = {
  auth: () => Promise<Session>;
  createUnofficialAto: (args: {
    ownerUserId: string;
    name: string;
    route: string;
    description?: string | null;
    personalityName?: string | null;
    instructions?: string | null;
  }) => Promise<{ id: string; name: string; route: string | null } | null>;
  createUnofficialAtoInstallRecords: (args: {
    atoId: string;
    ownerUserId: string;
    name: string;
    route: string;
    description?: string | null;
  }) => Promise<unknown>;
  getUnofficialAtoCountByOwner: (args: {
    ownerUserId: string;
    createdAfter?: Date;
  }) => Promise<number>;
  getUnofficialAtoByRouteGlobal: (args: {
    route: string;
  }) => Promise<{ id: string } | null>;
  getUnofficialAtosByOwner: (args: {
    ownerUserId: string;
  }) => Promise<unknown[]>;
  getUserById: (args: { id: string }) => Promise<{ foundersAccess?: boolean | null } | null>;
  listRouteRegistryEntries: () => Promise<Array<{ slash: string }>>;
};

export function createAtoHandlers(deps: CreateAtoDeps) {
  const isReservedAtoRoute = async (normalizedRoute: string) => {
    const routes = await deps.listRouteRegistryEntries();
    return routes.some(
      (route) => normalizeRouteKey(route.slash) === normalizedRoute
    );
  };

  const GET = async () => {
    const session = await deps.auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const atos = await deps.getUnofficialAtosByOwner({ ownerUserId: session.user.id });
    return NextResponse.json({ atos });
  };

  const POST = async (request: Request) => {
    const session = await deps.auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });

    const rawRoute = typeof payload.route === "string" ? payload.route : "";
    const formattedRoute = formatAtoRoute(rawRoute || name);
    const normalizedRoute = normalizeAtoRoute(formattedRoute);
    if (!formattedRoute || !normalizedRoute) {
      return NextResponse.json({ error: "slash route is required." }, { status: 400 });
    }

    if (await isReservedAtoRoute(normalizedRoute)) {
      return NextResponse.json({ error: "Slash route conflicts with an existing ATO." }, { status: 400 });
    }

    const existingRoute = await deps.getUnofficialAtoByRouteGlobal({ route: formattedRoute });
    if (existingRoute) {
      return NextResponse.json({ error: "Slash route is already in use." }, { status: 400 });
    }

    const user = await deps.getUserById({ id: session.user.id });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const hasFoundersAccess = Boolean(user.foundersAccess);
    const hasAvatar = payload.hasAvatar === true;
    if (hasAvatar && !hasFoundersAccess) {
      return NextResponse.json({ error: "Avatar pairing currently requires Founders access." }, { status: 403 });
    }

    const instructionsValue = typeof payload.instructions === "string" ? payload.instructions.trim() : "";
    const instructionsLimit = hasFoundersAccess ? 999 : 500;
    if (instructionsValue.length > instructionsLimit) {
      return NextResponse.json({ error: `Instructions must be ${instructionsLimit} characters or fewer.` }, { status: 400 });
    }

    const count = await deps.getUnofficialAtoCountByOwner({ ownerUserId: session.user.id, ...(hasFoundersAccess ? { createdAfter: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } : {}) });
    if ((hasFoundersAccess && count >= 10) || (!hasFoundersAccess && count >= 3)) {
      return NextResponse.json({ error: hasFoundersAccess ? "Founders members can create up to 10 unofficial ATOs per month." : "Free accounts can create up to 3 unofficial ATOs. Upgrade to Founders for more." }, { status: 403 });
    }

    if (payload.intelligenceMode && !allowedIntelligenceModes.includes(payload.intelligenceMode as never)) {
      return NextResponse.json({ error: "Invalid intelligence mode." }, { status: 400 });
    }

    const created = await deps.createUnofficialAto({
      ownerUserId: session.user.id,
      name,
      route: formattedRoute,
      description: typeof payload.description === "string" ? payload.description : null,
      personalityName: typeof payload.personalityName === "string" ? payload.personalityName : null,
      instructions: typeof payload.instructions === "string" ? payload.instructions.trim() : null,
    });

    if (!created) return NextResponse.json({ error: "Failed to create ATO." }, { status: 500 });

    try {
      await deps.createUnofficialAtoInstallRecords({
        atoId: created.id,
        ownerUserId: session.user.id,
        name,
        route: formattedRoute,
        description: typeof payload.description === "string" ? payload.description : null,
      });
    } catch (error) {
      console.warn("[ato] failed to create install records", { atoId: created.id, error });
    }

    return NextResponse.json({ ato: { id: created.id, name: created.name, route: created.route, hasAvatar } }, { status: 201 });
  };

  return { GET, POST };
}

export type AtoByIdDeps = {
  auth: () => Promise<Session>;
  deleteUnofficialAto: (args: { id: string; ownerUserId: string }) => Promise<unknown | null>;
  getUnofficialAtoByRouteGlobal: (args: { route: string }) => Promise<{ id: string } | null>;
  getUnofficialAtoById: (args: { id: string; ownerUserId: string }) => Promise<unknown | null>;
  getUserById: (args: { id: string }) => Promise<{ foundersAccess?: boolean | null } | null>;
  listRouteRegistryEntries: () => Promise<Array<{ slash: string }>>;
  updateUnofficialAtoSettings: (args: { id: string; ownerUserId: string; [key: string]: unknown }) => Promise<unknown | null>;
};

export function createAtoByIdHandlers(deps: AtoByIdDeps) {
  const isReservedAtoRoute = async (normalizedRoute: string) => {
    const routes = await deps.listRouteRegistryEntries();
    return routes.some((route) => normalizeRouteKey(route.slash) === normalizedRoute);
  };

  const GET = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await deps.auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { id: atoId } = await params;
    if (!atoId) return NextResponse.json({ error: "id is required." }, { status: 400 });
    const ato = await deps.getUnofficialAtoById({ id: atoId, ownerUserId: session.user.id });
    if (!ato) return NextResponse.json({ error: "ATO not found." }, { status: 404 });
    return NextResponse.json({ ato });
  };

  const DELETE = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await deps.auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { id: atoId } = await params;
    if (!atoId) return NextResponse.json({ error: "id is required." }, { status: 400 });
    const deleted = await deps.deleteUnofficialAto({ id: atoId, ownerUserId: session.user.id });
    if (!deleted) return NextResponse.json({ error: "ATO not found." }, { status: 404 });
    return NextResponse.json({ ato: deleted });
  };

  const PATCH = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await deps.auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { id: atoId } = await params;
    if (!atoId) return NextResponse.json({ error: "id is required." }, { status: 400 });
    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    const rawRoute = typeof payload.route === "string" ? payload.route : undefined;
    const formattedRoute = typeof rawRoute === "string" ? formatAtoRoute(rawRoute) : undefined;
    const normalizedRoute = typeof formattedRoute === "string" ? normalizeAtoRoute(formattedRoute) : undefined;
    if (typeof formattedRoute === "string" && !formattedRoute) return NextResponse.json({ error: "slash route is required." }, { status: 400 });
    if (typeof normalizedRoute === "string" && !normalizedRoute) return NextResponse.json({ error: "slash route is required." }, { status: 400 });
    if (typeof normalizedRoute === "string" && (await isReservedAtoRoute(normalizedRoute))) {
      return NextResponse.json({ error: "Slash route conflicts with an existing ATO." }, { status: 400 });
    }
    if (typeof formattedRoute === "string") {
      const existingRoute = await deps.getUnofficialAtoByRouteGlobal({ route: formattedRoute });
      if (existingRoute && existingRoute.id !== atoId) return NextResponse.json({ error: "Slash route is already in use." }, { status: 400 });
    }
    const instructionsValue = typeof payload.instructions === "string" ? payload.instructions.trim() : payload.instructions === null ? null : undefined;
    if (typeof instructionsValue === "string") {
      const user = await deps.getUserById({ id: session.user.id });
      if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
      const instructionsLimit = user.foundersAccess ? 999 : 500;
      if (instructionsValue.length > instructionsLimit) return NextResponse.json({ error: `Instructions must be ${instructionsLimit} characters or fewer.` }, { status: 400 });
    }
    const updated = await deps.updateUnofficialAtoSettings({
      id: atoId,
      ownerUserId: session.user.id,
      ...payload,
      route: typeof formattedRoute === "string" ? formattedRoute : undefined,
      instructions: typeof instructionsValue !== "undefined" ? instructionsValue || null : undefined,
    });
    if (!updated) return NextResponse.json({ error: "ATO not found." }, { status: 404 });
    return NextResponse.json({ ato: updated });
  };

  return { GET, DELETE, PATCH };
}
