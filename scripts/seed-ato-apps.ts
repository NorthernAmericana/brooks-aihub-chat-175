import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { bootstrapOfficialCatalog } from "../lib/store/bootstrapOfficialCatalog";

config({
  path: ".env.local",
});

const runSeed = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  POSTGRES_URL not defined, skipping seed");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const database = drizzle(connection);

  await bootstrapOfficialCatalog(database);

  await connection.end();
  console.log("✅ Seeded ATO apps and routes");
};

runSeed().catch((error) => {
  console.error("❌ Seed failed");
  console.error(error);
  process.exit(1);
});
