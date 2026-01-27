import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUnofficialAtoById, updateAtoFileEnabled } from "@/lib/db/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: atoId, fileId } = await params;

  if (!atoId || !fileId) {
    return NextResponse.json(
      { error: "id and fileId are required." },
      { status: 400 }
    );
  }

  let payload: { enabled?: boolean };

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (typeof payload.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled is required." },
      { status: 400 }
    );
  }

  const ato = await getUnofficialAtoById({
    id: atoId,
    ownerUserId: session.user.id,
  });

  if (!ato) {
    return NextResponse.json({ error: "ATO not found." }, { status: 404 });
  }

  const updated = await updateAtoFileEnabled({
    id: fileId,
    atoId,
    ownerUserId: session.user.id,
    enabled: payload.enabled,
  });

  if (!updated) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.json({ file: updated });
}
