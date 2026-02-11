import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createComment } from "@/lib/db/commons-queries";
import { createCommentSchema } from "@/lib/validation/commons-schema";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { postId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedPayload = createCommentSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsedPayload.error.issues },
      { status: 400 }
    );
  }

  const comment = await createComment({
    postId,
    authorId: session.user.id,
    ...parsedPayload.data,
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Post not found or parent comment is invalid." },
      { status: 404 }
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}
