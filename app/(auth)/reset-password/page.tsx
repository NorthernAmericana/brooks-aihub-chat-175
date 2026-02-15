import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const tokenParam = resolvedSearchParams.token;
  const token = typeof tokenParam === "string" ? tokenParam : "";

  return <ResetPasswordForm token={token} />;
}
