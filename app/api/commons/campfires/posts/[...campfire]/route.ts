import { NextResponse } from "next/server";
import { listPostsByCampfirePath } from "@/lib/db/commons-queries";
import { listPostsQuerySchema } from "@/lib/validation/commons-schema";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ campfire: string[] }> }
) {
  const { campfire } = await context.params;
  const campfirePath = campfire.join("/");

  const { searchParams } = new URL(request.url);
  const parsedQuery = listPostsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", issues: parsedQuery.error.issues },
      { status: 400 }
    );
  }

  const result = await listPostsByCampfirePath({
    campfirePath,
    ...parsedQuery.data,
  });

  if (!result.campfire) {
    return NextResponse.json({ error: "Campfire not found." }, { status: 404 });
  }

  return NextResponse.json({
    campfire: result.campfire,
    posts: result.posts,
    page: parsedQuery.data.page,
    pageSize: parsedQuery.data.pageSize,
    total: result.total,
  });
}
