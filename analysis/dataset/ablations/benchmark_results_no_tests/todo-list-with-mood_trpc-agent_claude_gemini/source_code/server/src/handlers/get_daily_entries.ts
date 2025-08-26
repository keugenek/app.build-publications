import { db } from '../db';
import { dailyEntriesTable } from '../db/schema';
import { type GetDailyEntriesInput, type DailyEntry } from '../schema';
import { gte, lte, and, desc } from 'drizzle-orm';

export async function getDailyEntries(input?: GetDailyEntriesInput): Promise<DailyEntry[]> {
  try {
    let results;

    // Handle different combinations of date filters
    if (input?.start_date && input?.end_date) {
      // Both start and end date provided
      results = await db.select()
        .from(dailyEntriesTable)
        .where(and(
          gte(dailyEntriesTable.date, input.start_date.toISOString().split('T')[0]),
          lte(dailyEntriesTable.date, input.end_date.toISOString().split('T')[0])
        ))
        .orderBy(desc(dailyEntriesTable.date))
        .execute();
    } else if (input?.start_date) {
      // Only start date provided
      results = await db.select()
        .from(dailyEntriesTable)
        .where(gte(dailyEntriesTable.date, input.start_date.toISOString().split('T')[0]))
        .orderBy(desc(dailyEntriesTable.date))
        .execute();
    } else if (input?.end_date) {
      // Only end date provided
      results = await db.select()
        .from(dailyEntriesTable)
        .where(lte(dailyEntriesTable.date, input.end_date.toISOString().split('T')[0]))
        .orderBy(desc(dailyEntriesTable.date))
        .execute();
    } else {
      // No date filters provided
      results = await db.select()
        .from(dailyEntriesTable)
        .orderBy(desc(dailyEntriesTable.date))
        .execute();
    }

    // Convert date strings back to Date objects for schema compatibility
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));
  } catch (error) {
    console.error('Failed to fetch daily entries:', error);
    throw error;
  }
}
