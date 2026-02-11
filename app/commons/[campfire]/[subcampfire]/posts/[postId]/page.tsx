import { renderCommonsPostDetail } from "@/app/commons/_components/post-detail-placeholder";

export default async function CommonsPostDetailDepthTwoPage({
  params,
}: {
  params: Promise<{ campfire: string; subcampfire: string; postId: string }>;
}) {
  const { campfire, subcampfire, postId } = await params;

  return renderCommonsPostDetail([campfire, subcampfire], postId);
}
