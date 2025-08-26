import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type UpdateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Calculates wellness score based on the wellness metrics
 * Same algorithm as in create_wellness_entry.ts
 */
function calculateWellnessScore(
  sleepHours: number,
  stressLevel: number,
  caffeineIntake: number,
  alcoholIntake: number
): number {
  let score = 0;

  // Sleep score (0-30 points)
  if (sleepHours >= 7 && sleepHours <= 9) {
    score += 30;
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    score += 25;
  } else if (sleepHours >= 5 && sleepHours <= 11) {
    score += 15;
  } else {
    score += 5;
  }

  // Stress score (0-30 points)
  score += Math.max(0, 30 - (stressLevel - 1) * 3.33);

  // Caffeine score (0-20 points)
  if (caffeineIntake <= 100) {
    score += 20;
  } else if (caffeineIntake <= 200) {
    score += 15;
  } else if (caffeineIntake <= 400) {
    score += 10;
  } else {
    score += 0;
  }

  // Alcohol score (0-20 points)
  if (alcoholIntake === 0) {
    score += 20;
  } else if (alcoholIntake <= 1) {
    score += 15;
  } else if (alcoholIntake <= 2) {
    score += 10;
  } else {
    score += 0;
  }

  return Math.round(score * 100) / 100;
}

export async function updateWellnessEntry(input: UpdateWellnessEntryInput): Promise<WellnessEntry | null> {
  try {
    // 1. Fetch the existing entry to get current values
    const existingEntries = await db.select()
      .from(wellnessEntriesTable)
      .where(eq(wellnessEntriesTable.id, input.id))
      .execute();

    if (existingEntries.length === 0) {
      return null; // Entry not found
    }

    const existing = existingEntries[0];

    // 2. Apply the updates (only fields that are provided)
    const updatedValues = {
      sleep_hours: input.sleep_hours !== undefined ? input.sleep_hours.toString() : existing.sleep_hours,
      stress_level: input.stress_level !== undefined ? input.stress_level : existing.stress_level,
      caffeine_intake: input.caffeine_intake !== undefined ? input.caffeine_intake : existing.caffeine_intake,
      alcohol_intake: input.alcohol_intake !== undefined ? input.alcohol_intake : existing.alcohol_intake
    };

    // 3. Recalculate the wellness score with the updated values
    const newWellnessScore = calculateWellnessScore(
      parseFloat(updatedValues.sleep_hours),
      updatedValues.stress_level,
      updatedValues.caffeine_intake,
      updatedValues.alcohol_intake
    );

    // 4. Save the updated entry to the database
    const result = await db.update(wellnessEntriesTable)
      .set({
        sleep_hours: updatedValues.sleep_hours,
        stress_level: updatedValues.stress_level,
        caffeine_intake: updatedValues.caffeine_intake,
        alcohol_intake: updatedValues.alcohol_intake,
        wellness_score: newWellnessScore.toString()
      })
      .where(eq(wellnessEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Update failed
    }

    // 5. Convert numeric fields back to numbers before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      sleep_hours: parseFloat(updatedEntry.sleep_hours),
      wellness_score: parseFloat(updatedEntry.wellness_score),
      date: new Date(updatedEntry.date),
      created_at: updatedEntry.created_at
    };
  } catch (error) {
    console.error('Wellness entry update failed:', error);
    throw error;
  }
}
