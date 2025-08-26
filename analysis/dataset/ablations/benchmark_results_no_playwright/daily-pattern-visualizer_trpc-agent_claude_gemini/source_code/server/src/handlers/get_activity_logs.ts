import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type GetActivityLogsInput, type ActivityLog } from '../schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';

export const getActivityLogs = async (input: GetActivityLogsInput): Promise<ActivityLog[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(activityLogsTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(activityLogsTable.date, input.start_date.toISOString().split('T')[0]));
    }
    
    if (input.end_date) {
      conditions.push(lte(activityLogsTable.date, input.end_date.toISOString().split('T')[0]));
    }

    // Build the complete query with all filters, ordering, and limit
    const results = await db.select()
      .from(activityLogsTable)
      .where(and(...conditions))
      .orderBy(desc(activityLogsTable.date))
      .limit(input.limit)
      .execute();

    // Convert numeric fields back to numbers and ensure proper date handling
    return results.map(result => ({
      ...result,
      sleep_hours: parseFloat(result.sleep_hours),
      work_hours: parseFloat(result.work_hours),
      social_hours: parseFloat(result.social_hours),
      screen_hours: parseFloat(result.screen_hours),
      date: new Date(result.date + 'T00:00:00.000Z'), // Convert date string to Date object
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Get activity logs failed:', error);
    throw error;
  }
};
