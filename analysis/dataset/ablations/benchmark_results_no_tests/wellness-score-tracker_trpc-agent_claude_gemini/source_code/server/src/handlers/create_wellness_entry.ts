import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';

// Wellness score calculation algorithm
function calculateWellnessScore(
  sleepHours: number,
  stressLevel: number,
  caffeineIntake: number,
  alcoholIntake: number
): number {
  // Sleep score: optimal 7-9 hours, penalty for too little or too much
  const sleepScore = Math.max(0, 100 - Math.abs(8 - sleepHours) * 10);
  
  // Stress score: lower stress is better (invert the 1-10 scale)
  const stressScore = (11 - stressLevel) * 10;
  
  // Caffeine penalty: moderate amounts okay, high amounts penalized
  const caffeineScore = Math.max(0, 100 - Math.max(0, caffeineIntake - 200) * 0.1);
  
  // Alcohol penalty: any alcohol reduces score
  const alcoholScore = Math.max(0, 100 - alcoholIntake * 20);
  
  // Weighted average of all factors
  const totalScore = (sleepScore * 0.3 + stressScore * 0.3 + caffeineScore * 0.2 + alcoholScore * 0.2);
  
  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

export const createWellnessEntry = async (input: CreateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
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
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string format
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        stress_level: input.stress_level,
        caffeine_intake: input.caffeine_intake.toString(), // Convert number to string for numeric column
        alcohol_intake: input.alcohol_intake.toString(), // Convert number to string for numeric column
        wellness_score: wellnessScore.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and date back to Date object
    const wellnessEntry = result[0];
    return {
      ...wellnessEntry,
      date: new Date(wellnessEntry.date), // Convert string date back to Date object
      sleep_hours: parseFloat(wellnessEntry.sleep_hours), // Convert string back to number
      caffeine_intake: parseFloat(wellnessEntry.caffeine_intake), // Convert string back to number
      alcohol_intake: parseFloat(wellnessEntry.alcohol_intake), // Convert string back to number
      wellness_score: parseFloat(wellnessEntry.wellness_score) // Convert string back to number
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
};
