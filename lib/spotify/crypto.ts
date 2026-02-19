import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getSpotifyEnv } from "@/lib/spotify/env";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const { spotifyTokenEncryptionKey } = getSpotifyEnv();
  return Buffer.from(spotifyTokenEncryptionKey, "base64");
}

export function encryptSpotifyToken(value: string): string {
  const iv = randomBytes(12);
  const key = getEncryptionKey();
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]).toString("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

export function decryptSpotifyToken(value: string): string {
  const [ivBase64, authTagBase64, encrypted] = value.split(":");

  if (!ivBase64 || !authTagBase64 || !encrypted) {
    throw new Error("Malformed encrypted Spotify token payload");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64")
  );

  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
