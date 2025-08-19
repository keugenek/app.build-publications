import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';

/**
 * Calculate wellness score based on sleep, stress, caffeine, and alcohol inputs
 * Formula considers optimal values and penalizes extremes
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
    sleepScore = 30; // Maximum sleep score
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    sleepScore = 20; // Good sleep score
  } else if (sleepHours >= 4 && sleepHours <= 11) {
    sleepScore = 10; // Moderate sleep score
  }
  // Below 4 or above 11 hours = 0 points

  // Stress score: lower is better (inverted scale)
  const stressScore = Math.max(0, 25 - (stressLevel - 1) * 2.8); // 25 points max, decreasing with stress

  // Caffeine score: moderate intake is acceptable, too much is penalized
  let caffeineScore = 15; // Start with max caffeine score
  if (caffeineIntake > 400) { // Above 400mg is excessive
    caffeineScore = Math.max(0, 15 - (caffeineIntake - 400) * 0.02);
  } else if (caffeineIntake > 200) { // Above 200mg is high but acceptable
    caffeineScore = 10;
  }

  // Alcohol score: less is better
  let alcoholScore = 30; // Start with max alcohol score
  if (alcoholIntake > 0) {
    alcoholScore = Math.max(0, 30 - alcoholIntake * 5); // Decrease by 5 points per unit
  }

  const totalScore = Math.round(sleepScore + stressScore + caffeineScore + alcoholScore);
  return Math.min(100, Math.max(0, totalScore)); // Ensure score is between 0-100
}

export const createWellnessEntry = async (input: CreateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // Calculate wellness score based on input parameters
    const wellnessScore = calculateWellnessScore(
      input.sleep_hours,
      input.stress_level,
      input.caffeine_intake,
      input.alcohol_intake
    );

    // Insert wellness entry record
    const result = await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        stress_level: input.stress_level, // Integer column - no conversion needed
        caffeine_intake: input.caffeine_intake.toString(), // Convert number to string for numeric column
        alcohol_intake: input.alcohol_intake.toString(), // Convert number to string for numeric column
        wellness_score: wellnessScore.toString(), // Convert number to string for numeric column
        entry_date: input.entry_date // String date in YYYY-MM-DD format
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const wellnessEntry = result[0];
    return {
      ...wellnessEntry,
      sleep_hours: parseFloat(wellnessEntry.sleep_hours), // Convert string back to number
      caffeine_intake: parseFloat(wellnessEntry.caffeine_intake), // Convert string back to number
      alcohol_intake: parseFloat(wellnessEntry.alcohol_intake), // Convert string back to number
      wellness_score: parseFloat(wellnessEntry.wellness_score), // Convert string back to number
      entry_date: new Date(wellnessEntry.entry_date + 'T00:00:00.000Z'), // Convert date string to Date object
      created_at: wellnessEntry.created_at // Already a Date object from timestamp column
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
};
