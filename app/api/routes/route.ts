import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { suggestRoutes } from "@/lib/routes/suggestRoutes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix")?.trim() || undefined;

  const routes = await suggestRoutes({ ownerUserId: session.user.id, prefix });
  return NextResponse.json({ routes });
}
