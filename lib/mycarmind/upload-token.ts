import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";
const TTL_SECONDS = 10 * 60;

const getSigningSecret = () =>
  process.env.MYCARMIND_UPLOAD_TOKEN_SECRET || process.env.AUTH_SECRET || "dev-secret";

const signToken = (payload: string) =>
  createHmac("sha256", getSigningSecret()).update(payload).digest("hex");

export const issueUploadToken = (
  userId: string,
  filename: string,
  contentType: string
) => {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${userId}.${expiresAt}.${filename}.${contentType}`;
  const signature = signToken(payload);
  return {
    token: `${payload}.${signature}`,
    expiresInSeconds: TTL_SECONDS,
  };
};

export const verifyUploadToken = ({
  token,
  userId,
  filename,
  contentType,
}: {
  token: string;
  userId: string;
  filename: string;
  contentType: string;
}) => {
  const parts = token.split(".");
  if (parts.length < 7) return false;

  const [version, tokenUserId, expiresAtRaw, ...rest] = parts;
  const signature = rest.pop();
  if (!signature) return false;

  const contentTypeToken = rest.pop();
  const filenameToken = rest.join(".");
  const expiresAt = Number(expiresAtRaw);

  if (
    version !== TOKEN_VERSION ||
    tokenUserId !== userId ||
    !Number.isFinite(expiresAt) ||
    Math.floor(Date.now() / 1000) > expiresAt ||
    filenameToken !== filename ||
    contentTypeToken !== contentType
  ) {
    return false;
  }

  const payload = `${version}.${tokenUserId}.${expiresAtRaw}.${filenameToken}.${contentTypeToken}`;
  const expected = Buffer.from(signToken(payload), "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
};
