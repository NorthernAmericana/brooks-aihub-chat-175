import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

type TableReadyState = "unchecked" | "ready" | "missing";

let tableReadyState: TableReadyState = "unchecked";
let tableReadyPromise: Promise<boolean> | null = null;
let hasLoggedMissingTable = false;

const logMissingTable = () => {
  if (hasLoggedMissingTable) {
    return;
  }

  hasLoggedMissingTable = true;
  console.warn(
    '[DB SCHEMA CHECK] Missing public."ato_app_reviews" table. Run database migrations to enable reviews.'
  );
};

export async function isAtoAppReviewsTableReady() {
  if (tableReadyState === "ready") {
    return true;
  }

  if (tableReadyState === "missing") {
    return false;
  }

  if (!tableReadyPromise) {
    tableReadyPromise = db
      .execute<{ table_name: string | null }>(sql`
        SELECT to_regclass('public.ato_app_reviews') AS table_name;
      `)
      .then((rows) => {
        const exists = Boolean(rows[0]?.table_name);
        tableReadyState = exists ? "ready" : "missing";

        if (!exists) {
          logMissingTable();
        }

        return exists;
      })
      .catch((error) => {
        console.warn(
          "[DB SCHEMA CHECK] Unable to verify ato_app_reviews table state.",
          error
        );
        tableReadyState = "missing";
        logMissingTable();
        return false;
      })
      .finally(() => {
        tableReadyPromise = null;
      });
  }

  return tableReadyPromise;
}
