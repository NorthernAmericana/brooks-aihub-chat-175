import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "../errors";

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "No database URL configured. Set POSTGRES_URL or DATABASE_URL before starting the service.",
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
const REQUIRED_STORE_TABLES = [
  "ato_apps",
  "ato_routes",
  "user_installs",
  "namc_install_gate_state",
] as const;
const REQUIRED_NAMC_INSTALL_GATE_STATE_COLUMNS = [
  "id",
  "user_id",
  "verification_status",
  "verification_method",
  "verification_checked_at",
  "verification_details",
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

type SpotifySchemaVerificationState = "unchecked" | "healthy" | "unhealthy";
let spotifySchemaVerificationState: SpotifySchemaVerificationState =
  "unchecked";
let spotifySchemaVerificationPromise: Promise<void> | null = null;
let hasLoggedSpotifySchemaFailure = false;

async function verifyChatSchemaColumns() {
  const { missingColumns } = await getChatSchemaHealthSnapshot();

  if (missingColumns.length === 1 && missingColumns[0] === "sessionType") {
    console.warn(
      '[DB SCHEMA CHECK] Auto-remediating missing public."Chat"."sessionType" column to avoid downtime. This is a compatibility fallback; run migrations to keep schema in sync.',
    );

    await db.execute(sql`
      ALTER TABLE "Chat"
      ADD COLUMN IF NOT EXISTS "sessionType" varchar DEFAULT 'chat';
    `);

    await db.execute(sql`
      UPDATE "Chat"
      SET "sessionType" = 'chat'
      WHERE "sessionType" IS NULL;
    `);

    await db.execute(sql`
      ALTER TABLE "Chat"
      ALTER COLUMN "sessionType" SET DEFAULT 'chat';
    `);

    return;
  }

  if (missingColumns.length > 0) {
    if (!hasLoggedChatSchemaFailure) {
      hasLoggedChatSchemaFailure = true;
      console.error(
        `[DB SCHEMA CHECK] Missing required columns on public."Chat": ${missingColumns.join(", ")}. Run database migrations before starting the service (e.g. pnpm db:migrate).`,
      );
    }

    throw new ChatSDKError(
      "offline:database",
      `Missing required Chat columns: ${missingColumns.join(", ")}`,
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
    (columnName) => !existingColumns.has(columnName),
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

export async function getStoreSchemaHealthSnapshot() {
  const tableRows = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public';
  `);

  const existingTables = new Set(tableRows.map((row) => row.table_name));
  const missingTables = REQUIRED_STORE_TABLES.filter(
    (tableName) => !existingTables.has(tableName),
  );

  let missingNamcInstallGateStateColumns = [
    ...REQUIRED_NAMC_INSTALL_GATE_STATE_COLUMNS,
  ];

  if (existingTables.has("namc_install_gate_state")) {
    const columnRows = await db.execute<{ column_name: string }>(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'namc_install_gate_state';
    `);

    const existingColumns = new Set(columnRows.map((row) => row.column_name));
    missingNamcInstallGateStateColumns =
      REQUIRED_NAMC_INSTALL_GATE_STATE_COLUMNS.filter(
        (columnName) => !existingColumns.has(columnName),
      );
  }

  return {
    missingTables,
    missingNamcInstallGateStateColumns,
  };
}

export async function getSpotifySchemaHealthSnapshot() {
  const tableRows = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spotify_accounts';
  `);

  return {
    spotifyAccountsTableExists: tableRows.length > 0,
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
    (columnName) => !existingColumns.has(columnName),
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
        }. Run database migrations before starting the service (e.g. pnpm db:migrate).`,
      );
    }

    throw new ChatSDKError(
      "offline:database",
      `Chat-rate-limit schema is not ready. Missing Chat columns: ${
        missingChatColumns.join(", ") || "none"
      }; missing Message_v2 columns: ${
        missingMessageColumns.join(", ") || "none"
      }`,
    );
  }
}

async function verifySpotifySchema() {
  const { spotifyAccountsTableExists } = await getSpotifySchemaHealthSnapshot();

  if (!spotifyAccountsTableExists) {
    if (!hasLoggedSpotifySchemaFailure) {
      hasLoggedSpotifySchemaFailure = true;
      console.error(
        "[DB SCHEMA CHECK] Missing required table public.spotify_accounts. Run database migrations before starting the service (e.g. pnpm db:migrate).",
      );
    }

    throw new ChatSDKError(
      "offline:database",
      "Spotify schema is not ready. Missing public.spotify_accounts table.",
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
      "Chat table schema is not ready. Run migrations and restart the service.",
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
      "Chat-rate-limit tables are not ready. Run migrations and restart the service.",
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

export function assertSpotifyAccountsTableReady() {
  if (spotifySchemaVerificationState === "healthy") {
    return;
  }

  if (spotifySchemaVerificationState === "unhealthy") {
    throw new ChatSDKError(
      "offline:database",
      "Spotify schema is not ready. Run migrations and restart the service.",
    );
  }

  if (!spotifySchemaVerificationPromise) {
    spotifySchemaVerificationPromise = verifySpotifySchema()
      .then(() => {
        spotifySchemaVerificationState = "healthy";
      })
      .catch((error) => {
        spotifySchemaVerificationState = "unhealthy";
        throw error;
      })
      .finally(() => {
        spotifySchemaVerificationPromise = null;
      });
  }

  return spotifySchemaVerificationPromise;
}
