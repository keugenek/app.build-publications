import { db } from '../db';
import { catActivityLogsTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput, type CatActivityLog } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function getCatActivities(input: GetActivitiesByDateRangeInput): Promise<CatActivityLog[]> {
  try {
    // Convert date strings to Date objects for comparison
    const startDate = new Date(input.start_date + 'T00:00:00.000Z');
    const endDate = new Date(input.end_date + 'T23:59:59.999Z');

    // Build query to get activities within date range for specific cat
    const results = await db.select()
      .from(catActivityLogsTable)
      .where(and(
        eq(catActivityLogsTable.cat_id, input.cat_id),
        gte(catActivityLogsTable.occurred_at, startDate),
        lte(catActivityLogsTable.occurred_at, endDate)
      ))
      .orderBy(desc(catActivityLogsTable.occurred_at))
      .execute();

    // Return the results (no type conversion needed as all fields are already correct types)
    return results;
  } catch (error) {
    console.error('Failed to get cat activities:', error);
    throw error;
  }
}
