import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Calculates wellness score based on the wellness metrics
 * Algorithm considers optimal values and penalizes deviations:
 * - Sleep: Optimal 7-9 hours (max 30 points)
 * - Stress: Lower is better, 1=30 points, 10=0 points (max 30 points)
 * - Caffeine: Optimal 0-200mg, penalized beyond (max 20 points)
 * - Alcohol: Optimal 0-1 units, penalized beyond (max 20 points)
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
    score += 30; // Optimal sleep
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    score += 25; // Good sleep
  } else if (sleepHours >= 5 && sleepHours <= 11) {
    score += 15; // Fair sleep
  } else {
    score += 5; // Poor sleep
  }

  // Stress score (0-30 points) - inverse relationship
  score += Math.max(0, 30 - (stressLevel - 1) * 3.33);

  // Caffeine score (0-20 points)
  if (caffeineIntake <= 100) {
    score += 20; // Optimal caffeine
  } else if (caffeineIntake <= 200) {
    score += 15; // Moderate caffeine
  } else if (caffeineIntake <= 400) {
    score += 10; // High caffeine
  } else {
    score += 0; // Excessive caffeine
  }

  // Alcohol score (0-20 points)
  if (alcoholIntake === 0) {
    score += 20; // No alcohol
  } else if (alcoholIntake <= 1) {
    score += 15; // Moderate alcohol
  } else if (alcoholIntake <= 2) {
    score += 10; // Higher alcohol
  } else {
    score += 0; // Excessive alcohol
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

export async function createWellnessEntry(input: CreateWellnessEntryInput): Promise<WellnessEntry> {
  try {
    // Check for duplicate entry for the same user and date
    const existingEntry = await db.select()
      .from(wellnessEntriesTable)
      .where(
        and(
          eq(wellnessEntriesTable.user_id, input.user_id),
          eq(wellnessEntriesTable.date, input.date)
        )
      )
      .execute();

    if (existingEntry.length > 0) {
      throw new Error(`Wellness entry already exists for user ${input.user_id} on ${input.date}`);
    }

    // Calculate wellness score
    const wellnessScore = calculateWellnessScore(
      input.sleep_hours,
      input.stress_level,
      input.caffeine_intake,
      input.alcohol_intake
    );

    // Insert wellness entry record
    const result = await db.insert(wellnessEntriesTable)
      .values({
        user_id: input.user_id,
        date: input.date,
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        stress_level: input.stress_level,
        caffeine_intake: input.caffeine_intake,
        alcohol_intake: input.alcohol_intake,
        wellness_score: wellnessScore.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const entry = result[0];
    return {
      ...entry,
      date: new Date(entry.date), // Ensure date is Date object
      sleep_hours: parseFloat(entry.sleep_hours), // Convert string back to number
      wellness_score: parseFloat(entry.wellness_score) // Convert string back to number
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
}
