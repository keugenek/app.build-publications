import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntries } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Creates a new wellness entry in the database.
 *
 * The wellness_score is calculated using a simple heuristic:
 *   score = sleep_hours * 2 - stress_level * 3 - caffeine_servings * 1 - alcohol_servings * 2
 *
 * Numeric columns (`sleep_hours` and `wellness_score`) are stored as `numeric`
 * types in PostgreSQL, which Drizzle returns as strings. We convert them back to
 * numbers before returning the result.
 */
export const createWellnessEntry = async (
  input: CreateWellnessEntryInput,
): Promise<WellnessEntry> => {
  // Default date handling – if the client omitted the date we use today (YYYY‑MM‑DD).
  const date = input.date ?? new Date().toISOString().split('T')[0];

  // Simple deterministic calculation for the wellness score.
  const rawScore =
    input.sleep_hours * 2 -
    input.stress_level * 3 -
    input.caffeine_servings * 1 -
    input.alcohol_servings * 2;

  try {
    // Insert the record. Numeric columns must be passed as strings.
    const inserted = await db
      .insert(wellnessEntries)
      .values({
        date,
        sleep_hours: input.sleep_hours.toString(), // numeric column
        stress_level: input.stress_level,
        caffeine_servings: input.caffeine_servings,
        alcohol_servings: input.alcohol_servings,
        wellness_score: rawScore.toString(), // numeric column
      })
      .returning()
      .execute();

    const raw = inserted[0];

    // Convert numeric fields back to numbers for the API contract.
    const result: WellnessEntry = {
      id: raw.id,
      date: raw.date,
      sleep_hours: parseFloat(raw.sleep_hours as unknown as string),
      stress_level: raw.stress_level,
      caffeine_servings: raw.caffeine_servings,
      alcohol_servings: raw.alcohol_servings,
      wellness_score: parseFloat(raw.wellness_score as unknown as string),
      created_at: raw.created_at,
    };

    return result;
  } catch (error) {
    console.error('Failed to create wellness entry:', error);
    throw error;
  }
};
