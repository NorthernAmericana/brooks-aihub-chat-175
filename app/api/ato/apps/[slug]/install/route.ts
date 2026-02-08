import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { atoApps } from "@/lib/db/schema";
import { installApp } from "@/lib/store/installApp";
import { uninstallApp } from "@/lib/store/uninstallApp";

export const dynamic = "force-dynamic";

const getAppBySlug = async (slug: string) => {
  const [app] = await db
    .select()
    .from(atoApps)
    .where(eq(atoApps.slug, slug))
    .limit(1);

  return app ?? null;
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const app = await getAppBySlug(trimmedSlug);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  await installApp(session.user.id, app.id);

  return NextResponse.json({ installed: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const app = await getAppBySlug(trimmedSlug);

  if (!app) {
    return NextResponse.json({ error: "App not found." }, { status: 404 });
  }

  await uninstallApp(session.user.id, app.id);

  return NextResponse.json({ installed: false });
}
