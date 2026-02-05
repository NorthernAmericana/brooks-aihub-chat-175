import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { resolveRoute } from "@/lib/routes/resolveRoute";
import { suggestRoutes } from "@/lib/routes/suggestRoutes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const route = searchParams.get("route")?.trim();

  if (!route) {
    return NextResponse.json({ error: "Route is required." }, { status: 400 });
  }

  const resolved = await resolveRoute({
    route,
    ownerUserId: session.user.id,
  });

  if (resolved) {
    const isRedirectedRoute = /^https?:\/\//i.test(resolved.route);

    if (isRedirectedRoute) {
      return NextResponse.json({
        status: "redirected",
        route: resolved,
        redirectUrl: resolved.route,
      });
    }

    return NextResponse.json({
      status: "resolved",
      route: resolved,
    });
  }

  const suggestions = await suggestRoutes({
    ownerUserId: session.user.id,
    prefix: route,
  });

  return NextResponse.json({
    status: "unknown",
    suggestions,
  });
}
