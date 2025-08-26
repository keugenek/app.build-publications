import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { type DailyConspiracyLevel } from '../schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const getDailyConspiracyLevel = async (date: Date): Promise<DailyConspiracyLevel> => {
  try {
    // Create start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Aggregate data for the specified date
    const result = await db.select({
      total_points: sql<number>`COALESCE(SUM(${suspiciousActivitiesTable.conspiracy_points}), 0)::integer`,
      activity_count: sql<number>`COUNT(*)::integer`
    })
    .from(suspiciousActivitiesTable)
    .where(
      and(
        gte(suspiciousActivitiesTable.recorded_at, startOfDay),
        lt(suspiciousActivitiesTable.recorded_at, endOfDay)
      )
    )
    .execute();

    return {
      date: date,
      total_points: result[0].total_points,
      activity_count: result[0].activity_count
    };
  } catch (error) {
    console.error('Failed to calculate daily conspiracy level:', error);
    throw error;
  }
};
