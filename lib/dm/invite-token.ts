import { createHash, randomBytes } from "node:crypto";

const DM_INVITE_TOKEN_TTL_SECONDS = 60 * 60 * 24;

export const hashDmInviteToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function issueDmInviteToken(options: { expiresInSeconds?: number }) {
  const expiresInSeconds = Math.max(
    60,
    Math.min(
      options.expiresInSeconds ?? DM_INVITE_TOKEN_TTL_SECONDS,
      60 * 60 * 24 * 7
    )
  );
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashDmInviteToken(token),
    expiresInSeconds,
    expiresAt,
  };
}
