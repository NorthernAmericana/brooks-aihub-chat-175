import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function generatePasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPasswordResetTokenUsable({
  expiresAt,
  usedAt,
  now,
}: {
  expiresAt: Date;
  usedAt: Date | null;
  now?: Date;
}) {
  const current = now ?? new Date();
  return !usedAt && expiresAt.getTime() > current.getTime();
}
