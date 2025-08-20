import { db } from '../db';
import { catActivityLogsTable, dailyConspiracySummariesTable } from '../db/schema';
import { type DailyConspiracySummary } from '../schema';
import { calculateConspiracyLevel } from './get_conspiracy_levels';
import { eq, and, between, sql } from 'drizzle-orm';

export async function updateDailySummary(catId: number, date: string): Promise<DailyConspiracySummary> {
  try {
    // Create start and end timestamps for the date
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Calculate total conspiracy points and activity count for the date
    const activityStats = await db
      .select({
        totalPoints: sql<number>`COALESCE(SUM(${catActivityLogsTable.conspiracy_points}), 0)`,
        activityCount: sql<number>`COUNT(*)`
      })
      .from(catActivityLogsTable)
      .where(
        and(
          eq(catActivityLogsTable.cat_id, catId),
          between(catActivityLogsTable.occurred_at, startOfDay, endOfDay)
        )
      )
      .execute();

    const totalPoints = Number(activityStats[0].totalPoints);
    const activityCount = Number(activityStats[0].activityCount);

    // Determine conspiracy level based on total points
    const conspiracyLevel = calculateConspiracyLevel(totalPoints);

    // Check if summary already exists for this cat and date
    const existingSummary = await db
      .select()
      .from(dailyConspiracySummariesTable)
      .where(
        and(
          eq(dailyConspiracySummariesTable.cat_id, catId),
          eq(dailyConspiracySummariesTable.date, date)
        )
      )
      .execute();

    if (existingSummary.length > 0) {
      // Update existing summary
      const updated = await db
        .update(dailyConspiracySummariesTable)
        .set({
          total_conspiracy_points: totalPoints,
          conspiracy_level: conspiracyLevel.level,
          activity_count: activityCount
        })
        .where(
          and(
            eq(dailyConspiracySummariesTable.cat_id, catId),
            eq(dailyConspiracySummariesTable.date, date)
          )
        )
        .returning()
        .execute();

      return updated[0];
    } else {
      // Create new summary
      const created = await db
        .insert(dailyConspiracySummariesTable)
        .values({
          cat_id: catId,
          date: date,
          total_conspiracy_points: totalPoints,
          conspiracy_level: conspiracyLevel.level,
          activity_count: activityCount
        })
        .returning()
        .execute();

      return created[0];
    }
  } catch (error) {
    console.error('Daily summary update failed:', error);
    throw error;
  }
}
