import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Calculate wellness score based on sleep, stress, caffeine, and alcohol inputs
 * Same formula as create handler for consistency
 */
function calculateWellnessScore(
  sleepHours: number,
  stressLevel: number,
  caffeineIntake: number,
  alcoholIntake: number
): number {
  // Sleep score: optimal around 7-9 hours
  let sleepScore = 0;
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepScore = 30;
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    sleepScore = 20;
  } else if (sleepHours >= 4 && sleepHours <= 11) {
    sleepScore = 10;
  }

  // Stress score: lower is better (inverted scale)
  const stressScore = Math.max(0, 25 - (stressLevel - 1) * 2.8);

  // Caffeine score: moderate intake is acceptable
  let caffeineScore = 15;
  if (caffeineIntake > 400) {
    caffeineScore = Math.max(0, 15 - (caffeineIntake - 400) * 0.02);
  } else if (caffeineIntake > 200) {
    caffeineScore = 10;
  }

  // Alcohol score: less is better
  let alcoholScore = 30;
  if (alcoholIntake > 0) {
    alcoholScore = Math.max(0, 30 - alcoholIntake * 5);
  }

  const totalScore = Math.round(sleepScore + stressScore + caffeineScore + alcoholScore);
  return Math.min(100, Math.max(0, totalScore));
}

export async function updateWellnessEntry(input: UpdateWellnessEntryInput): Promise<WellnessEntry | null> {
  try {
    // First, check if the entry exists
    const existingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    if (existingEntries.length === 0) {
      return null;
    }

    const existingEntry = existingEntries[0];

    // Prepare updated values, using existing values for fields not being updated
    const updatedValues = {
      sleep_hours: input.sleep_hours !== undefined ? input.sleep_hours.toString() : existingEntry.sleep_hours,
      stress_level: input.stress_level !== undefined ? input.stress_level : existingEntry.stress_level,
      caffeine_intake: input.caffeine_intake !== undefined ? input.caffeine_intake.toString() : existingEntry.caffeine_intake,
      alcohol_intake: input.alcohol_intake !== undefined ? input.alcohol_intake.toString() : existingEntry.alcohol_intake,
      entry_date: input.entry_date !== undefined ? input.entry_date : existingEntry.entry_date
    };

    // Recalculate wellness score using the updated values
    const sleepHours = parseFloat(updatedValues.sleep_hours);
    const stressLevel = updatedValues.stress_level;
    const caffeineIntake = parseFloat(updatedValues.caffeine_intake);
    const alcoholIntake = parseFloat(updatedValues.alcohol_intake);

    const wellnessScore = calculateWellnessScore(sleepHours, stressLevel, caffeineIntake, alcoholIntake);

    // Update the entry in the database
    const result = await db.update(wellnessEntriesTable)
      .set({
        ...updatedValues,
        wellness_score: wellnessScore.toString()
      })
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers and date to Date object before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      sleep_hours: parseFloat(updatedEntry.sleep_hours),
      stress_level: updatedEntry.stress_level,
      caffeine_intake: parseFloat(updatedEntry.caffeine_intake),
      alcohol_intake: parseFloat(updatedEntry.alcohol_intake),
      wellness_score: parseFloat(updatedEntry.wellness_score),
      entry_date: new Date(updatedEntry.entry_date)
    };
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
}
