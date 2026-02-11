import { renderCommonsPostDetail } from "@/app/commons/_components/post-detail-placeholder";

export default async function CommonsPostDetailDepthOnePage({
  params,
}: {
  params: Promise<{ campfire: string; postId: string }>;
}) {
  const { campfire, postId } = await params;

  return renderCommonsPostDetail([campfire], postId);
}
