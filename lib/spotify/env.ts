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

let hasValidatedSpotifyEncryptionKey = false;

export function getSpotifyEnv() {
  const spotifyClientId = readRequiredEnv("SPOTIFY_CLIENT_ID");
  const spotifyRedirectUri = readRequiredEnv("SPOTIFY_REDIRECT_URI");
  const appOrigin = readRequiredEnv("APP_ORIGIN");
  const spotifyTokenEncryptionKey = readRequiredEnv(
    "SPOTIFY_TOKEN_ENCRYPTION_KEY"
  );

  if (!hasValidatedSpotifyEncryptionKey) {
    const keyBytes = Buffer.from(spotifyTokenEncryptionKey, "base64");

    if (keyBytes.length !== 32) {
      throw new Error(
        "SPOTIFY_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes"
      );
    }

    hasValidatedSpotifyEncryptionKey = true;
  }

  return {
    spotifyClientId,
    spotifyClientSecret: readOptionalEnv("SPOTIFY_CLIENT_SECRET"),
    spotifyRedirectUri,
    spotifyTokenEncryptionKey,
    appOrigin,
  };
}
