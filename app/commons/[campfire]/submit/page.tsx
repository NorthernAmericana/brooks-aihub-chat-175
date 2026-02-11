import { renderCommonsSubmit } from "@/app/commons/_components/submit-placeholder";

export default async function CommonsSubmitDepthOnePage({
  params,
}: {
  params: Promise<{ campfire: string }>;
}) {
  const { campfire } = await params;

  return renderCommonsSubmit([campfire]);
}
