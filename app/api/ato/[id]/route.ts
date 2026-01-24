import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUnofficialAtoById } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const atoId = params.id;

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
