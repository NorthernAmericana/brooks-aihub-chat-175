import { createHmac, randomUUID } from "node:crypto";

const DM_INVITE_TOKEN_VERSION = "v1";
const DM_INVITE_TOKEN_TTL_SECONDS = 60 * 60 * 24;

const getDmInviteTokenSecret = () =>
  process.env.DM_INVITE_TOKEN_SECRET || process.env.AUTH_SECRET || "dev-secret";

const signPayload = (payload: string) =>
  createHmac("sha256", getDmInviteTokenSecret()).update(payload).digest("hex");

export function issueDmInviteToken(options: {
  roomId: string;
  inviterUserId: string;
  expiresInSeconds?: number;
}) {
  const expiresInSeconds = Math.max(
    60,
    Math.min(options.expiresInSeconds ?? DM_INVITE_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7)
  );
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const nonce = randomUUID();
  const payload = `${DM_INVITE_TOKEN_VERSION}.${options.roomId}.${options.inviterUserId}.${expiresAt}.${nonce}`;
  const signature = signPayload(payload);

  return {
    token: `${payload}.${signature}`,
    expiresInSeconds,
    expiresAt,
  };
}
