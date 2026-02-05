import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { suggestRoutes } from "@/lib/routes/suggestRoutes";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const routes = await suggestRoutes({ ownerUserId: session.user.id });
  return NextResponse.json({ routes });
}
