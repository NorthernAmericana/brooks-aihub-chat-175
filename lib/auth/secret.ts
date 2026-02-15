let hasWarnedMissingSecret = false;

export function resolveAuthSecret(): string | undefined {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-auth-secret");

  if (!secret && process.env.NODE_ENV === "production" && !hasWarnedMissingSecret) {
    console.warn(
      "[auth] Neither AUTH_SECRET nor NEXTAUTH_SECRET is set; auth token verification/signing is disabled."
    );
    hasWarnedMissingSecret = true;
  }

  return secret;
}
