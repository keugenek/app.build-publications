import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';

/**
 * Creates a new wellness entry with calculated wellness score.
 * The wellness score is calculated based on the following factors:
 * - Hours of sleep (optimal: 7-9 hours)
 * - Stress level (lower is better, 1-10 scale)
 * - Caffeine intake (moderate amounts are acceptable)
 * - Alcohol intake (lower is better)
 */
export async function createWellnessEntry(input: CreateWellnessEntryInput): Promise<WellnessEntry> {
  try {
    // Calculate wellness score based on input parameters
    const wellnessScore = calculateWellnessScore(
      input.hours_of_sleep,
      input.stress_level,
      input.caffeine_intake,
      input.alcohol_intake
    );

    // Convert date to YYYY-MM-DD format for database storage
    const dateString = input.date.toISOString().split('T')[0];

    // Insert wellness entry record
    const result = await db.insert(wellnessEntriesTable)
      .values({
        user_id: input.user_id,
        date: dateString,
        hours_of_sleep: input.hours_of_sleep, // Real column - no conversion needed
        stress_level: input.stress_level, // Integer column - no conversion needed
        caffeine_intake: input.caffeine_intake, // Real column - no conversion needed
        alcohol_intake: input.alcohol_intake, // Real column - no conversion needed
        wellness_score: wellnessScore // Real column - no conversion needed
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const wellnessEntry = result[0];
    return {
      ...wellnessEntry,
      date: new Date(wellnessEntry.date + 'T00:00:00.000Z') // Convert date string to Date object
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
}

/**
 * Calculates wellness score based on daily inputs.
 * Score ranges from 0-100, where 100 is optimal wellness.
 */
function calculateWellnessScore(
  hoursOfSleep: number,
  stressLevel: number,
  caffeineIntake: number,
  alcoholIntake: number
): number {
  let score = 100;
  
  // Sleep scoring (0-30 points) - optimal range is 7-9 hours
  if (hoursOfSleep < 7 || hoursOfSleep > 9) {
    score -= Math.abs(8 - hoursOfSleep) * 5; // Deduct 5 points per hour deviation from 8 hours
  }
  
  // Stress scoring (0-30 points) - lower stress is better
  score -= (stressLevel - 1) * 4; // Deduct 4 points per stress level above 1
  
  // Caffeine scoring (0-20 points) - moderate intake is acceptable
  if (caffeineIntake > 400) {
    score -= (caffeineIntake - 400) * 0.05; // Penalize excessive caffeine (over 400mg)
  } else if (caffeineIntake < 50 && caffeineIntake > 0) {
    score -= (50 - caffeineIntake) * 0.1; // Minor penalty for very low caffeine
  }
  
  // Alcohol scoring (0-20 points) - lower intake is better
  score -= alcoholIntake * 10; // Deduct 10 points per drink
  
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100)); // Clamp between 0-100 and round to 2 decimals
}
