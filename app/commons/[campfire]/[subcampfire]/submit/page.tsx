import { renderCommonsSubmit } from "@/app/commons/_components/submit";

export default async function CommonsSubmitDepthTwoPage({
  params,
}: {
  params: Promise<{ campfire: string; subcampfire: string }>;
}) {
  const { campfire, subcampfire } = await params;

  return renderCommonsSubmit([campfire, subcampfire]);
}
