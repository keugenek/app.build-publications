import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Calculates a wellness score based on health metrics.
 * Higher scores indicate better wellness.
 */
function calculateWellnessScore(
  hours_of_sleep: number,
  stress_level: number,
  caffeine_intake: number,
  alcohol_intake: number
): number {
  let score = 100; // Start with perfect score

  // Sleep score: optimal range 7-9 hours
  if (hours_of_sleep < 6 || hours_of_sleep > 10) {
    score -= 20;
  } else if (hours_of_sleep < 7 || hours_of_sleep > 9) {
    score -= 10;
  }

  // Stress level penalty (1 is best, 10 is worst)
  score -= (stress_level - 1) * 5; // Each level above 1 reduces score by 5

  // Caffeine penalty: moderate intake is okay
  if (caffeine_intake > 400) { // Over 400mg is excessive
    score -= 15;
  } else if (caffeine_intake > 200) { // Over 200mg is moderate
    score -= 5;
  }
  // No penalty for caffeine under 200mg

  // Alcohol penalty
  if (alcohol_intake > 2) { // More than 2 drinks
    score -= 20;
  } else if (alcohol_intake > 1) { // More than 1 drink
    score -= 10;
  } else if (alcohol_intake > 0) { // Any alcohol
    score -= 5;
  }

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

/**
 * Updates an existing wellness entry and recalculates the wellness score.
 * Only allows updating the daily metrics, not the user_id or date.
 */
export async function updateWellnessEntry(input: UpdateWellnessEntryInput): Promise<WellnessEntry | null> {
  try {
    // First, fetch the existing entry to verify it exists and get current values
    const existingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    if (existingEntries.length === 0) {
      return null; // Entry not found
    }

    const existingEntry = existingEntries[0];

    // Prepare update values - use provided values or fall back to existing ones
    const currentValues = {
      hours_of_sleep: existingEntry.hours_of_sleep,
      stress_level: existingEntry.stress_level,
      caffeine_intake: existingEntry.caffeine_intake,
      alcohol_intake: existingEntry.alcohol_intake,
    };

    const updateValues = {
      hours_of_sleep: input.hours_of_sleep ?? currentValues.hours_of_sleep,
      stress_level: input.stress_level ?? currentValues.stress_level,
      caffeine_intake: input.caffeine_intake ?? currentValues.caffeine_intake,
      alcohol_intake: input.alcohol_intake ?? currentValues.alcohol_intake,
    };

    // Calculate new wellness score with updated values
    const wellness_score = calculateWellnessScore(
      updateValues.hours_of_sleep,
      updateValues.stress_level,
      updateValues.caffeine_intake,
      updateValues.alcohol_intake
    );

    // Update the entry with new values and recalculated score
    const result = await db.update(wellnessEntriesTable)
      .set({
        hours_of_sleep: updateValues.hours_of_sleep,
        stress_level: updateValues.stress_level,
        caffeine_intake: updateValues.caffeine_intake,
        alcohol_intake: updateValues.alcohol_intake,
        wellness_score: wellness_score,
        updated_at: new Date()
      })
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date) // Convert date string to Date object
    };
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
}
