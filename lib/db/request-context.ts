import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function withUserDbContext<T>(
  userId: string,
  callback: (tx: unknown) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true);`
    );
    return callback(tx);
  });
}
