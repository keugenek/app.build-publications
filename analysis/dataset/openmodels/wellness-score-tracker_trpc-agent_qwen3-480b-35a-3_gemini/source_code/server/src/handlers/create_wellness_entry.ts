import { type CreateWellnessEntryInput, type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';

export const createWellnessEntry = async (input: CreateWellnessEntryInput): Promise<WellnessEntry> => {
  try {
    // Calculate wellness score based on input data
    // Simple wellness score calculation:
    // - Higher sleep contributes positively (max 24 hours = 10 points)
    // - Lower stress contributes positively (1 = 10 points, 10 = 1 point)
    // - Lower caffeine contributes positively (0 = 10 points, more = fewer points)
    // - Lower alcohol contributes positively (0 = 10 points, more = fewer points)
    
    const sleepScore = Math.min(10, (input.sleep_hours / 24) * 10);
    const stressScore = 11 - input.stress_level; // 1-10 becomes 10-1
    const caffeineScore = Math.max(0, 10 - input.caffeine_intake);
    const alcoholScore = Math.max(0, 10 - input.alcohol_intake);
    
    const wellnessScore = (sleepScore + stressScore + caffeineScore + alcoholScore) / 4;
    
    // Insert the new wellness entry into the database
    const result = await db.insert(wellnessEntriesTable)
      .values({
        date: input.date instanceof Date ? input.date.toISOString().split('T')[0] : input.date, // Convert Date to string in YYYY-MM-DD format
        sleep_hours: input.sleep_hours.toString(), // Convert to string for numeric field
        stress_level: input.stress_level,
        caffeine_intake: input.caffeine_intake,
        alcohol_intake: input.alcohol_intake,
        wellness_score: wellnessScore.toString(), // Convert to string for numeric field
      })
      .returning()
      .execute();
    
    // Convert string values back to numbers for the return object
    const entry = result[0];
    return {
      ...entry,
      date: new Date(entry.date), // Convert string back to Date
      sleep_hours: parseFloat(entry.sleep_hours),
      wellness_score: parseFloat(entry.wellness_score),
    };
  } catch (error) {
    console.error('Wellness entry creation failed:', error);
    throw error;
  }
};
