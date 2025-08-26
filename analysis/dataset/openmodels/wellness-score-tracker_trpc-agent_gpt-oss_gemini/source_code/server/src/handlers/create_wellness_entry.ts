import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Handler for creating a wellness entry.
 * Calculates a wellness_score based on provided metrics, persists the entry,
 * and returns the stored record with proper numeric conversions.
 */
export const createWellnessEntry = async (
  input: CreateWellnessEntryInput
): Promise<WellnessEntry> => {
  try {
    // Use provided entry_date or default to now
    const entryDate = input.entry_date ?? new Date();

    // Simple wellness score calculation (example)
    const rawScore =
      input.sleep_hours * 0.4 -
      (input.stress_level ?? 0) * 0.3 -
      input.caffeine_intake * 0.1 -
      input.alcohol_intake * 0.1;
    const wellnessScore = Number(rawScore.toFixed(2));

    // Insert record (numeric values must be strings for numeric columns)
    const result = await db
      .insert(wellnessEntries)
      .values({
        entry_date: entryDate,
        sleep_hours: input.sleep_hours.toString(),
        stress_level: input.stress_level,
        caffeine_intake: input.caffeine_intake.toString(),
        alcohol_intake: input.alcohol_intake.toString(),
        wellness_score: wellnessScore.toString()
      })
      .returning()
      .execute();

    const row = result[0];
    // Convert numeric fields back to numbers for the output type
    const entry: WellnessEntry = {
      id: row.id,
      entry_date: row.entry_date,
      sleep_hours: parseFloat(row.sleep_hours),
      stress_level: row.stress_level,
      caffeine_intake: parseFloat(row.caffeine_intake),
      alcohol_intake: parseFloat(row.alcohol_intake),
      wellness_score: parseFloat(row.wellness_score),
      created_at: row.created_at
    };
    return entry;
  } catch (error) {
    console.error('Failed to create wellness entry:', error);
    throw error;
  }
};
