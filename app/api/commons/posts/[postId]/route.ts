import { NextResponse } from "next/server";
import { getPostWithComments } from "@/lib/db/commons-queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  const postWithComments = await getPostWithComments(postId);

  if (!postWithComments) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  return NextResponse.json(postWithComments);
}
