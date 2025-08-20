import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';

export const createWellnessEntry = async (input: CreateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // Calculate wellness score
    const wellnessScore = calculateWellnessScore({
      sleep_hours: input.sleep_hours,
      stress_level: input.stress_level,
      caffeine_intake: input.caffeine_intake,
      alcohol_intake: input.alcohol_intake
    });

    // Insert wellness entry record
    const result = await db.insert(wellnessEntriesTable)
      .values({
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        stress_level: input.stress_level,
        caffeine_intake: input.caffeine_intake,
        alcohol_intake: input.alcohol_intake,
        wellness_score: wellnessScore.toString(), // Convert number to string for numeric column
        user_id: input.user_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const entry = result[0];
    return {
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours), // Convert string back to number
      wellness_score: parseFloat(entry.wellness_score) // Convert string back to number
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
};

// Helper function to calculate wellness score
const calculateWellnessScore = (params: {
  sleep_hours: number;
  stress_level: number;
  caffeine_intake: number;
  alcohol_intake: number;
}): number => {
  // Simple wellness score calculation
  let score = 50; // Base score
  
  // Add points for sleep (8 hours is optimal)
  score += (params.sleep_hours - 8) * 2;
  
  // Subtract points for stress
  score -= (params.stress_level - 5) * 3;
  
  // Subtract points for caffeine and alcohol
  score -= (params.caffeine_intake + params.alcohol_intake) * 1.5;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100)); // Round to 2 decimal places
};
