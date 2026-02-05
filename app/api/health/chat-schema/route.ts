import { NextResponse } from "next/server";
import { getChatSchemaHealthSnapshot } from "@/lib/db";

export async function GET() {
  try {
    const { missingColumns, nullSessionTypeCount } =
      await getChatSchemaHealthSnapshot();

    const hasNullSessionType =
      typeof nullSessionTypeCount === "number" && nullSessionTypeCount > 0;

    const healthy = missingColumns.length === 0 && !hasNullSessionType;

    return NextResponse.json(
      {
        healthy,
        table: "public.Chat",
        missingColumns,
        nullSessionTypeCount,
      },
      {
        status: healthy ? 200 : 503,
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown schema check failure";

    return NextResponse.json(
      {
        healthy: false,
        table: "public.Chat",
        error: message,
      },
      {
        status: 503,
      }
    );
  }
}
