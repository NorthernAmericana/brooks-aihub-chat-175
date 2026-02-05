import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env.local",
});

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "No database URL configured for Drizzle. Set POSTGRES_URL or DATABASE_URL.",
  );
}

const databaseUrlEnvVar = process.env.POSTGRES_URL
  ? "POSTGRES_URL"
  : "DATABASE_URL";

console.log(`ℹ️  drizzle-kit using ${databaseUrlEnvVar}`);

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
