import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createPost } from "@/lib/db/commons-queries";
import { createPostSchema } from "@/lib/validation/commons-schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedPayload = createPostSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsedPayload.error.issues },
      { status: 400 }
    );
  }

  const post = await createPost({
    authorId: session.user.id,
    ...parsedPayload.data,
  });

  if (!post) {
    return NextResponse.json(
      { error: "Campfire not found or not writable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ post }, { status: 201 });
}
