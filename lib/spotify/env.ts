function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Spotify env var: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

type SpotifyEnv = {
  spotifyClientId: string;
  spotifyClientSecret: string | null;
  spotifyRedirectUri: string;
  spotifyTokenEncryptionKey: string;
  appOrigin: string;
};

let cachedSpotifyEnv: SpotifyEnv | undefined;

function validateSpotifyEncryptionKey(base64Value: string) {
  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Value) ||
    base64Value.length % 4 !== 0
  ) {
    throw new Error("SPOTIFY_TOKEN_ENCRYPTION_KEY must be valid base64");
  }

  const keyBytes = Buffer.from(base64Value, "base64");

  if (keyBytes.length !== 32) {
    throw new Error(
      "SPOTIFY_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }
}

function buildSpotifyEnv(): SpotifyEnv {
  const spotifyClientId = readRequiredEnv("SPOTIFY_CLIENT_ID");
  const spotifyRedirectUri = readRequiredEnv("SPOTIFY_REDIRECT_URI");
  const appOrigin = readRequiredEnv("APP_ORIGIN");
  const spotifyTokenEncryptionKey = readRequiredEnv(
    "SPOTIFY_TOKEN_ENCRYPTION_KEY"
  );

  validateSpotifyEncryptionKey(spotifyTokenEncryptionKey);

  return {
    spotifyClientId,
    spotifyClientSecret: readOptionalEnv("SPOTIFY_CLIENT_SECRET"),
    spotifyRedirectUri,
    spotifyTokenEncryptionKey,
    appOrigin,
  };
}

export function validateSpotifyEnvAtBoot() {
  if (cachedSpotifyEnv) {
    return cachedSpotifyEnv;
  }

  try {
    cachedSpotifyEnv = buildSpotifyEnv();
    console.info("[spotify] Environment validation succeeded at startup.");
    return cachedSpotifyEnv;
  } catch (error) {
    console.error("[spotify] Environment validation failed at startup.", error);
    throw error;
  }
}

export function getSpotifyEnv() {
  return cachedSpotifyEnv ?? validateSpotifyEnvAtBoot();
}

validateSpotifyEnvAtBoot();
