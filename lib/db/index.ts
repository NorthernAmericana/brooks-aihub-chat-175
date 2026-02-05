import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

const REQUIRED_CHAT_COLUMNS = [
  "id",
  "createdAt",
  "userId",
  "title",
  "visibility",
  "routeKey",
  "sessionType",
] as const;

type ChatSchemaVerificationState = "unchecked" | "healthy" | "unhealthy";
let chatSchemaVerificationState: ChatSchemaVerificationState = "unchecked";
let chatSchemaVerificationPromise: Promise<void> | null = null;
let hasLoggedChatSchemaFailure = false;

async function verifyChatSchemaColumns() {
  const rows = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Chat';
  `);

  const existingColumns = new Set(rows.map((row) => row.column_name));
  const missingColumns = REQUIRED_CHAT_COLUMNS.filter(
    (columnName) => !existingColumns.has(columnName)
  );

  if (missingColumns.length > 0) {
    if (!hasLoggedChatSchemaFailure) {
      hasLoggedChatSchemaFailure = true;
      console.error(
        `[DB SCHEMA CHECK] Missing required columns on public."Chat": ${missingColumns.join(", ")}. Run database migrations before starting the service (e.g. pnpm db:migrate).`
      );
    }

    throw new ChatSDKError(
      "offline:database",
      `Missing required Chat columns: ${missingColumns.join(", ")}`
    );
  }
}

export function assertChatTableColumnsReady() {
  if (chatSchemaVerificationState === "healthy") {
    return;
  }

  if (chatSchemaVerificationState === "unhealthy") {
    throw new ChatSDKError(
      "offline:database",
      "Chat table schema is not ready. Run migrations and restart the service."
    );
  }

  if (!chatSchemaVerificationPromise) {
    chatSchemaVerificationPromise = verifyChatSchemaColumns()
      .then(() => {
        chatSchemaVerificationState = "healthy";
      })
      .catch((error) => {
        chatSchemaVerificationState = "unhealthy";
        throw error;
      })
      .finally(() => {
        chatSchemaVerificationPromise = null;
      });
  }

  return chatSchemaVerificationPromise;
}
