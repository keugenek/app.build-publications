import { db } from '../db';
import { tripHistoryTable } from '../db/schema';
import { type TripHistory } from '../schema';
import { desc } from 'drizzle-orm';

export async function getTripHistory(): Promise<TripHistory[]> {
  try {
    // Query all trip history records ordered by creation date (most recent first)
    const results = await db.select()
      .from(tripHistoryTable)
      .orderBy(desc(tripHistoryTable.created_at))
      .execute();

    // Convert numeric fields from database (real columns are returned as numbers, no conversion needed)
    // Convert dates to proper Date objects for the schema
    return results.map(record => ({
      ...record,
      // Real columns (max_temperature, precipitation) are already numbers from PostgreSQL
      max_temperature: record.max_temperature, // Already a number
      precipitation: record.precipitation, // Already a number
      forecast_date: record.forecast_date, // Already a Date object
      created_at: record.created_at // Already a Date object
    }));
  } catch (error) {
    console.error('Failed to fetch trip history:', error);
    throw error;
  }
}
