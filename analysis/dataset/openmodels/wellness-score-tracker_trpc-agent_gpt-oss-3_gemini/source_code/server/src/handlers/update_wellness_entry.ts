import { eq } from 'drizzle-orm';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';

/**
 * Updates a wellness entry in the database.
 * Numeric columns are stored as strings in PostgreSQL (numeric type) and therefore
 * need to be converted to strings when writing and parsed back to numbers when reading.
 */
export async function updateWellnessEntry(
  input: UpdateWellnessEntryInput,
): Promise<WellnessEntry> {
  try {
    // Build the set object with only the provided fields
    const set: Partial<
      typeof wellnessEntriesTable.$inferInsert
    > = {};

    if (input.sleep_hours !== undefined) {
      // numeric column -> store as string
      set.sleep_hours = input.sleep_hours.toString();
    }
    if (input.stress_level !== undefined) {
      set.stress_level = input.stress_level;
    }
    if (input.caffeine_servings !== undefined) {
      set.caffeine_servings = input.caffeine_servings;
    }
    if (input.alcohol_servings !== undefined) {
      set.alcohol_servings = input.alcohol_servings;
    }
    if (input.wellness_score !== undefined) {
      set.wellness_score = input.wellness_score.toString();
    }

    // Perform the update
    const result = await db
      .update(wellnessEntriesTable)
      .set(set)
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Wellness entry with id ${input.id} not found`);
    }

    const updated = result[0];
    // Convert numeric fields back to numbers before returning
    return {
      ...updated,
      sleep_hours: parseFloat(updated.sleep_hours as unknown as string),
      wellness_score: parseFloat(updated.wellness_score as unknown as string),
    } as WellnessEntry;
  } catch (error) {
    console.error('Failed to update wellness entry:', error);
    throw error;
  }
}
