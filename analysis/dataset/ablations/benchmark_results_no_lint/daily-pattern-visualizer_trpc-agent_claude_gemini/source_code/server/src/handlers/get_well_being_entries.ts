import { db } from '../db';
import { wellBeingEntriesTable } from '../db/schema';
import { type GetWellBeingEntriesInput, type WellBeingEntry } from '../schema';
import { and, gte, lte, desc } from 'drizzle-orm';

export const getWellBeingEntries = async (input?: GetWellBeingEntriesInput): Promise<WellBeingEntry[]> => {
  try {
    // Use default values if no input provided
    const filters = input || { limit: 30 };
    
    // Build conditions array
    const conditions = [];
    
    if (filters.start_date) {
      // Convert Date to YYYY-MM-DD string for comparison with date column
      const startDateStr = filters.start_date.toISOString().split('T')[0];
      conditions.push(gte(wellBeingEntriesTable.date, startDateStr));
    }

    if (filters.end_date) {
      // Convert Date to YYYY-MM-DD string for comparison with date column
      const endDateStr = filters.end_date.toISOString().split('T')[0];
      conditions.push(lte(wellBeingEntriesTable.date, endDateStr));
    }

    // Build and execute query
    const baseQuery = db.select().from(wellBeingEntriesTable);
    
    let finalQuery;
    if (conditions.length === 1) {
      finalQuery = baseQuery.where(conditions[0]);
    } else if (conditions.length > 1) {
      finalQuery = baseQuery.where(and(...conditions));
    } else {
      finalQuery = baseQuery;
    }

    const results = await finalQuery
      .orderBy(desc(wellBeingEntriesTable.date))
      .limit(filters.limit)
      .execute();

    // Convert fields to match schema expectations
    return results.map(entry => ({
      ...entry,
      date: new Date(entry.date + 'T00:00:00Z'), // Convert date string to Date object
      sleep_hours: parseFloat(entry.sleep_hours.toString()),
      work_hours: parseFloat(entry.work_hours.toString()),
      social_time_hours: parseFloat(entry.social_time_hours.toString()),
      screen_time_hours: parseFloat(entry.screen_time_hours.toString())
    }));
  } catch (error) {
    console.error('Failed to get well-being entries:', error);
    throw error;
  }
};
