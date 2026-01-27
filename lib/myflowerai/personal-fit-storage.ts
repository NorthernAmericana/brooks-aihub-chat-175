/**
 * Personal Fit Storage Helper
 * 
 * Helper functions for storing and retrieving personal fit data
 * from the private per-user database table.
 * 
 * See /docs/myflowerai/personal-fit.md for complete documentation.
 */

import "server-only";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { personalFit } from "@/lib/db/schema";
import { PersonalFitSchemaV1_0, type PersonalFit } from "@/lib/validation/personal-fit-schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export type PersonalFitInput = {
  strain_id: string;
  rating_1to10?: number;
  best_for?: string[];
  avoid_for?: string[];
  repeat_probability_0to1?: number;
  notes?: string;
};

/**
 * Save or update personal fit data for a user and strain.
 * 
 * IMPORTANT: Always get user consent before calling this function.
 * 
 * @param userId - The user's ID
 * @param data - Personal fit data to save
 * @param userConsent - Whether the user has consented to storing this data
 * @returns The saved personal fit record
 * 
 * @example
 * ```typescript
 * // After getting user consent
 * const saved = await savePersonalFit(userId, {
 *   strain_id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g-2026-01-25",
 *   rating_1to10: 8,
 *   best_for: ["morning creativity", "weekend projects"],
 *   avoid_for: ["work meetings"],
 *   repeat_probability_0to1: 0.85,
 *   notes: "Great for creative work"
 * }, true);
 * ```
 */
export async function savePersonalFit(
  userId: string,
  data: PersonalFitInput,
  userConsent: boolean = false
): Promise<PersonalFit> {
  if (!userConsent) {
    throw new Error("Cannot save personal fit data without user consent");
  }

  // Validate with schema
  const validated = PersonalFitSchemaV1_0.parse({
    schema_version: "1.0",
    personal_fit_id: crypto.randomUUID(),
    strain_id: data.strain_id,
    privacy: {
      storage_location: "database_user_private",
      user_consent: userConsent
    },
    rating_1to10: data.rating_1to10,
    best_for: data.best_for,
    avoid_for: data.avoid_for,
    repeat_probability_0to1: data.repeat_probability_0to1,
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Check if personal fit already exists for this user and strain
  const existing = await getUserPersonalFit(userId, data.strain_id);

  if (existing) {
    // Update existing record
    const updated = await db
      .update(personalFit)
      .set({
        rating1to10: data.rating_1to10?.toString(),
        bestFor: data.best_for,
        avoidFor: data.avoid_for,
        repeatProbability0to1: data.repeat_probability_0to1?.toString(),
        notes: data.notes,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(personalFit.userId, userId),
          eq(personalFit.strainId, data.strain_id)
        )
      )
      .returning();

    return mapToPersonalFit(updated[0]);
  }

  // Insert new record
  const inserted = await db
    .insert(personalFit)
    .values({
      userId: userId,
      strainId: data.strain_id,
      rating1to10: data.rating_1to10?.toString(),
      bestFor: data.best_for,
      avoidFor: data.avoid_for,
      repeatProbability0to1: data.repeat_probability_0to1?.toString(),
      notes: data.notes,
      userConsent: userConsent
    })
    .returning();

  return mapToPersonalFit(inserted[0]);
}

/**
 * Get personal fit data for a specific user and strain.
 * 
 * @param userId - The user's ID
 * @param strainId - The strain's ID
 * @returns The personal fit record, or null if not found
 * 
 * @example
 * ```typescript
 * const fit = await getUserPersonalFit(userId, strainId);
 * if (fit) {
 *   console.log(`User rated this strain ${fit.rating_1to10}/10`);
 * }
 * ```
 */
export async function getUserPersonalFit(
  userId: string,
  strainId: string
): Promise<PersonalFit | null> {
  const result = await db
    .select()
    .from(personalFit)
    .where(
      and(
        eq(personalFit.userId, userId),
        eq(personalFit.strainId, strainId)
      )
    )
    .limit(1);

  return result[0] ? mapToPersonalFit(result[0]) : null;
}

/**
 * Get all personal fit records for a user.
 * 
 * @param userId - The user's ID
 * @returns Array of personal fit records
 * 
 * @example
 * ```typescript
 * const allFits = await getUserPersonalFits(userId);
 * console.log(`User has tracked ${allFits.length} strains`);
 * ```
 */
export async function getUserPersonalFits(userId: string): Promise<PersonalFit[]> {
  const results = await db
    .select()
    .from(personalFit)
    .where(eq(personalFit.userId, userId));

  return results.map(mapToPersonalFit);
}

/**
 * Delete personal fit data for a user and strain.
 * 
 * @param userId - The user's ID
 * @param strainId - The strain's ID
 * @returns True if deleted, false if not found
 * 
 * @example
 * ```typescript
 * const deleted = await deletePersonalFit(userId, strainId);
 * if (deleted) {
 *   console.log('Personal fit data deleted');
 * }
 * ```
 */
export async function deletePersonalFit(
  userId: string,
  strainId: string
): Promise<boolean> {
  const result = await db
    .delete(personalFit)
    .where(
      and(
        eq(personalFit.userId, userId),
        eq(personalFit.strainId, strainId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Map database record to PersonalFit type
 */
function mapToPersonalFit(record: typeof personalFit.$inferSelect): PersonalFit {
  return {
    schema_version: "1.0",
    personal_fit_id: record.personalFitId,
    strain_id: record.strainId,
    privacy: {
      storage_location: record.storageLocation as "database_user_private" | "local_encrypted" | "private_namespace",
      user_consent: record.userConsent
    },
    rating_1to10: record.rating1to10 ? Number.parseFloat(record.rating1to10) : undefined,
    best_for: record.bestFor ?? undefined,
    avoid_for: record.avoidFor ?? undefined,
    repeat_probability_0to1: record.repeatProbability0to1 ? Number.parseFloat(record.repeatProbability0to1) : undefined,
    notes: record.notes ?? undefined,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString()
  };
}
