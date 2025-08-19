import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type MoodEntry, type DateRangeInput } from '../schema';
import { and, gte, lte, desc, SQL } from 'drizzle-orm';

export const getMoodEntries = async (dateRange?: DateRangeInput): Promise<MoodEntry[]> => {
  try {
    // Build conditions array for date filtering
    const conditions: SQL<unknown>[] = [];

    if (dateRange?.start_date) {
      conditions.push(gte(moodEntriesTable.date, dateRange.start_date));
    }

    if (dateRange?.end_date) {
      conditions.push(lte(moodEntriesTable.date, dateRange.end_date));
    }

    // Build the complete query
    const baseQuery = db.select().from(moodEntriesTable);
    
    const queryWithConditions = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await queryWithConditions
      .orderBy(desc(moodEntriesTable.date))
      .execute();

    // Convert date strings to Date objects to match schema
    return results.map(result => ({
      ...result,
      date: new Date(result.date), // Convert string date to Date object
    }));
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    throw error;
  }
};
