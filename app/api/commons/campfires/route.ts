import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createCampfire, listCampfires } from "@/lib/db/commons-queries";
import { createCampfireSchema } from "@/lib/validation/commons-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const campfires = await listCampfires();
  return NextResponse.json({ campfires });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsedPayload = createCampfireSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsedPayload.error.issues },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof createCampfire>>;

  try {
    result = await createCampfire({
      creatorId: session.user.id,
      mode: parsedPayload.data.mode,
      retentionMode: parsedPayload.data.retentionMode,
      rollingWindowSize: parsedPayload.data.rollingWindowSize,
      expiresInHours: parsedPayload.data.expiresInHours,
      name: parsedPayload.data.name,
      description: parsedPayload.data.description,
      campfirePath: parsedPayload.data.campfirePath,
      recipientEmail: parsedPayload.data.recipientEmail,
      recipientEmails: parsedPayload.data.recipientEmails,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Unable to create campfire." },
      { status: 500 }
    );
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      campfire: result.campfire,
      isExisting: result.isExisting,
    },
    { status: result.isExisting ? 200 : 201 }
  );
}
