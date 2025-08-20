import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { type CreateActivityLogInput, type ActivityLog } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createActivityLog(input: CreateActivityLogInput): Promise<ActivityLog> {
  try {
    // Validate that the date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison
    
    if (input.date > today) {
      throw new Error('Cannot create activity log for future dates');
    }

    // Check for duplicate entries for the same date/user
    const existing = await db.select()
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.user_id, input.user_id),
        eq(activityLogsTable.date, input.date.toISOString().split('T')[0]) // Format as YYYY-MM-DD
      ))
      .execute();

    if (existing.length > 0) {
      throw new Error('Activity log already exists for this date');
    }

    // Insert activity log record
    const result = await db.insert(activityLogsTable)
      .values({
        user_id: input.user_id,
        date: input.date.toISOString().split('T')[0], // Format as YYYY-MM-DD for date column
        sleep_hours: input.sleep_hours.toString(), // Convert number to string for numeric column
        work_hours: input.work_hours.toString(),
        social_hours: input.social_hours.toString(),
        screen_hours: input.screen_hours.toString(),
        emotional_energy: input.emotional_energy, // Integer column - no conversion needed
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const activityLog = result[0];
    return {
      ...activityLog,
      date: new Date(activityLog.date + 'T00:00:00.000Z'), // Convert date string back to Date
      sleep_hours: parseFloat(activityLog.sleep_hours), // Convert string back to number
      work_hours: parseFloat(activityLog.work_hours),
      social_hours: parseFloat(activityLog.social_hours),
      screen_hours: parseFloat(activityLog.screen_hours)
    };
  } catch (error) {
    console.error('Activity log creation failed:', error);
    throw error;
  }
}
