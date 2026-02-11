import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withUserDbContext<T>(
  userId: string,
  callback: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true);`
    );
    return callback(tx);
  });
}
