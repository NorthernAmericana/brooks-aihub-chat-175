import { NextResponse } from "next/server";
import { assertSpotifyAccountsTableReady, getSpotifySchemaHealthSnapshot } from "@/lib/db";

export async function GET() {
  try {
    await assertSpotifyAccountsTableReady();

    const { spotifyAccountsTableExists, missingColumns } =
      await getSpotifySchemaHealthSnapshot();
    const healthy = spotifyAccountsTableExists && missingColumns.length === 0;

    return NextResponse.json(
      {
        healthy,
        spotifyAccountsTable: "public.spotify_accounts",
        spotifyAccountsTableExists,
        missingColumns,
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
