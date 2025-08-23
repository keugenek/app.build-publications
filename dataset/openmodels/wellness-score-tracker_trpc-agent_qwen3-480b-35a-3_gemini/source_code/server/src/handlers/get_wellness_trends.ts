import { type WellnessTrend } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getWellnessTrends = async (): Promise<WellnessTrend[]> => {
  try {
    // Fetch wellness entries for trend visualization, sorted by date
    const entries = await db.select({
      date: wellnessEntriesTable.date,
      wellness_score: wellnessEntriesTable.wellness_score,
    }).from(wellnessEntriesTable).orderBy(desc(wellnessEntriesTable.date));
    
    // Convert string values back to numbers for the return objects
    return entries.map(entry => ({
      date: new Date(entry.date), // Convert string back to Date
      wellness_score: parseFloat(entry.wellness_score as string),
    })) as WellnessTrend[];
  } catch (error) {
    console.error('Failed to fetch wellness trends:', error);
    throw error;
  }
};
