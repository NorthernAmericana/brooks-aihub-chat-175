import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "No database URL configured. Set POSTGRES_URL or DATABASE_URL before starting the service."
  );
}

const client = postgres(databaseUrl);
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

const REQUIRED_CHAT_RATE_LIMIT_CHAT_COLUMNS = ["id", "userId"] as const;
const REQUIRED_CHAT_RATE_LIMIT_MESSAGE_COLUMNS = [
  "id",
  "chatId",
  "role",
  "createdAt",
] as const;

type ChatSchemaVerificationState = "unchecked" | "healthy" | "unhealthy";
let chatSchemaVerificationState: ChatSchemaVerificationState = "unchecked";
let chatSchemaVerificationPromise: Promise<void> | null = null;
let hasLoggedChatSchemaFailure = false;

type ChatRateLimitSchemaVerificationState =
  | "unchecked"
  | "healthy"
  | "unhealthy";
let chatRateLimitSchemaVerificationState: ChatRateLimitSchemaVerificationState =
  "unchecked";
let chatRateLimitSchemaVerificationPromise: Promise<void> | null = null;
let hasLoggedChatRateLimitSchemaFailure = false;

async function verifyChatSchemaColumns() {
  const { missingColumns } = await getChatSchemaHealthSnapshot();

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

export async function getChatSchemaHealthSnapshot() {
  const rows = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Chat';
  `);

  const existingColumns = new Set(rows.map((row) => row.column_name));
  const missingColumns = REQUIRED_CHAT_COLUMNS.filter(
    (columnName) => !existingColumns.has(columnName)
  );

  let nullSessionTypeCount: number | null = null;

  if (existingColumns.has("sessionType")) {
    const nullRows = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int AS count
      FROM "Chat"
      WHERE "sessionType" IS NULL;
    `);

    nullSessionTypeCount = nullRows[0]?.count ?? 0;
  }

  return {
    missingColumns,
    nullSessionTypeCount,
  };
}

async function verifyTableColumns({
  tableName,
  requiredColumns,
}: {
  tableName: string;
  requiredColumns: readonly string[];
}) {
  const rows = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName};
  `);

  const existingColumns = new Set(rows.map((row) => row.column_name));
  const missingColumns = requiredColumns.filter(
    (columnName) => !existingColumns.has(columnName)
  );

  return missingColumns;
}

async function verifyChatRateLimitSchemaColumns() {
  const missingChatColumns = await verifyTableColumns({
    tableName: "Chat",
    requiredColumns: REQUIRED_CHAT_RATE_LIMIT_CHAT_COLUMNS,
  });
  const missingMessageColumns = await verifyTableColumns({
    tableName: "Message_v2",
    requiredColumns: REQUIRED_CHAT_RATE_LIMIT_MESSAGE_COLUMNS,
  });

  if (missingChatColumns.length > 0 || missingMessageColumns.length > 0) {
    if (!hasLoggedChatRateLimitSchemaFailure) {
      hasLoggedChatRateLimitSchemaFailure = true;
      console.error(
        `[DB SCHEMA CHECK] Chat-rate-limit schema is not ready. Missing Chat columns: ${
          missingChatColumns.join(", ") || "none"
        }; missing Message_v2 columns: ${
          missingMessageColumns.join(", ") || "none"
        }. Run database migrations before starting the service (e.g. pnpm db:migrate).`
      );
    }

    throw new ChatSDKError(
      "offline:database",
      `Chat-rate-limit schema is not ready. Missing Chat columns: ${
        missingChatColumns.join(", ") || "none"
      }; missing Message_v2 columns: ${
        missingMessageColumns.join(", ") || "none"
      }`
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

export function assertChatRateLimitTablesReady() {
  if (chatRateLimitSchemaVerificationState === "healthy") {
    return;
  }

  if (chatRateLimitSchemaVerificationState === "unhealthy") {
    throw new ChatSDKError(
      "offline:database",
      "Chat-rate-limit tables are not ready. Run migrations and restart the service."
    );
  }

  if (!chatRateLimitSchemaVerificationPromise) {
    chatRateLimitSchemaVerificationPromise = verifyChatRateLimitSchemaColumns()
      .then(() => {
        chatRateLimitSchemaVerificationState = "healthy";
      })
      .catch((error) => {
        chatRateLimitSchemaVerificationState = "unhealthy";
        throw error;
      })
      .finally(() => {
        chatRateLimitSchemaVerificationPromise = null;
      });
  }

  return chatRateLimitSchemaVerificationPromise;
}
