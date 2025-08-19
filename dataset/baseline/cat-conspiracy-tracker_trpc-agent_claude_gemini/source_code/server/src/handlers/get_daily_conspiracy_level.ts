import { db } from '../db';
import { dailyConspiracyLevelsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetDailyConspiracyLevelInput, type DailyConspiracyLevel } from '../schema';

export async function getDailyConspiracyLevel(input: GetDailyConspiracyLevelInput): Promise<DailyConspiracyLevel | null> {
  try {
    // Format the date to YYYY-MM-DD for date column comparison
    const targetDate = input.date.toISOString().split('T')[0];

    const results = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, targetDate))
      .execute();

    // Return the first result or null if none found
    if (results.length > 0) {
      const result = results[0];
      return {
        ...result,
        date: new Date(result.date) // Convert string date to Date object
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get daily conspiracy level:', error);
    throw error;
  }
}
