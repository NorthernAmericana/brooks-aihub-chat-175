import { NextResponse } from "next/server";
import { getChatSchemaHealthSnapshot, getStoreSchemaHealthSnapshot } from "@/lib/db";

export async function GET() {
  try {
    const [{ missingColumns, nullSessionTypeCount }, storeSchema] =
      await Promise.all([
        getChatSchemaHealthSnapshot(),
        getStoreSchemaHealthSnapshot(),
      ]);

    const hasNullSessionType =
      typeof nullSessionTypeCount === "number" && nullSessionTypeCount > 0;

    const hasMissingStoreTables = storeSchema.missingTables.length > 0;
    const hasMissingNamcVerificationColumns =
      storeSchema.missingNamcInstallGateStateColumns.length > 0;

    const healthy =
      missingColumns.length === 0 &&
      !hasNullSessionType &&
      !hasMissingStoreTables &&
      !hasMissingNamcVerificationColumns;

    return NextResponse.json(
      {
        healthy,
        chatTable: "public.Chat",
        chatMissingColumns: missingColumns,
        nullSessionTypeCount,
        storeMissingTables: storeSchema.missingTables,
        namcInstallGateStateTable: "public.namc_install_gate_state",
        namcInstallGateStateMissingColumns:
          storeSchema.missingNamcInstallGateStateColumns,
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
        chatTable: "public.Chat",
        error: message,
      },
      {
        status: 503,
      }
    );
  }
}
