import { NextResponse } from "next/server";
import { getSpotifySchemaHealthSnapshot } from "@/lib/db";

export async function GET() {
  try {
    const { spotifyAccountsTableExists } =
      await getSpotifySchemaHealthSnapshot();
    const healthy = spotifyAccountsTableExists;

    return NextResponse.json(
      {
        healthy,
        spotifyAccountsTable: "public.spotify_accounts",
        spotifyAccountsTableExists,
      },
      { status: healthy ? 200 : 503 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Spotify schema check failure";

    return NextResponse.json(
      {
        healthy: false,
        spotifyAccountsTable: "public.spotify_accounts",
        error: message,
      },
      { status: 503 },
    );
  }
}
