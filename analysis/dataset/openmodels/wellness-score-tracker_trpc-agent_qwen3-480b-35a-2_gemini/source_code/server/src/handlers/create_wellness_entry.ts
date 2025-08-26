import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';

// Simple algorithm to calculate wellness score:
// Base score: 50 points
// Sleep: Add 5 points for each hour above 6, subtract 5 points for each hour below 6
// Stress: Subtract 2 points for each point above 5
// Caffeine: Subtract 1 point for each serving above 2
// Alcohol: Subtract 3 points for each serving above 0
const calculateWellnessScore = (input: CreateWellnessEntryInput): number => {
  let score = 50; // Base score

  // Sleep contribution (6 hours is optimal)
  score += (input.sleep_hours - 6) * 5;

  // Stress contribution (5 is optimal)
  if (input.stress_level > 5) {
    score -= (input.stress_level - 5) * 2;
  }

  // Caffeine contribution (2 or less is optimal)
  if (input.caffeine_intake > 2) {
    score -= (input.caffeine_intake - 2) * 1;
  }

  // Alcohol contribution (0 is optimal)
  if (input.alcohol_intake > 0) {
    score -= input.alcohol_intake * 3;
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
};

export const createWellnessEntry = async (input: CreateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // Calculate wellness score
    const wellnessScore = calculateWellnessScore(input);

    // Format date as YYYY-MM-DD string for the date column
    const dateString = input.date.toISOString().split('T')[0];

    // Insert wellness entry record
    const result = await db.insert(wellnessEntriesTable)
      .values({
        date: dateString,
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        stress_level: input.stress_level, // Integer column - no conversion needed
        caffeine_intake: input.caffeine_intake.toString(), // Convert number to string for numeric column
        alcohol_intake: input.alcohol_intake.toString(), // Convert number to string for numeric column
        wellness_score: wellnessScore.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const wellnessEntry = result[0];
    return {
      ...wellnessEntry,
      date: new Date(wellnessEntry.date), // Convert date string back to Date object
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
