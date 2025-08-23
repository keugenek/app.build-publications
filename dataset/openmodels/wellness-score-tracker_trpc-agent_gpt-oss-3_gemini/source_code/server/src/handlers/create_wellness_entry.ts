import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { wellnessEntriesTable } from '../db/schema';
import { db } from '../db';

/**
 * Handler to create a new wellness entry.
 * Inserts the record into the database, converting numeric fields to strings for
 * numeric columns, then parses them back to numbers for the returned object.
 */
export async function createWellnessEntry(
  input: CreateWellnessEntryInput,
): Promise<WellnessEntry> {
  try {
    // Convert numeric values to strings for insertion into numeric columns
    const insertValues = {
      sleep_hours: input.sleep_hours.toString(),
      stress_level: input.stress_level,
      caffeine_servings: input.caffeine_servings,
      alcohol_servings: input.alcohol_servings,
      wellness_score: (input.wellness_score ?? 0).toString(),
    } as const;

    const result = await db
      .insert(wellnessEntriesTable)
      .values(insertValues)
      .returning()
      .execute();

    const row = result[0];
    // Convert numeric columns (stored as strings) back to numbers
    const entry: WellnessEntry = {
      id: row.id,
      sleep_hours: parseFloat(row.sleep_hours),
      stress_level: row.stress_level,
      caffeine_servings: row.caffeine_servings,
      alcohol_servings: row.alcohol_servings,
      wellness_score: parseFloat(row.wellness_score),
      created_at: row.created_at,
    };
    return entry;
  } catch (error) {
    console.error('Failed to create wellness entry:', error);
    throw error;
  }
}
