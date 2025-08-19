import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { type DailyConspiracyLevel } from '../schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

export async function calculateDailyConspiracyLevel(date: Date): Promise<DailyConspiracyLevel> {
  try {
    // Create date range for the specific day (start of day to start of next day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Query activities for the specific date and sum conspiracy scores
    const result = await db
      .select({
        total_conspiracy_score: sql<number>`COALESCE(SUM(${behaviorTypesTable.conspiracy_score}), 0)`,
        activity_count: sql<number>`COUNT(${catActivitiesTable.id})`
      })
      .from(catActivitiesTable)
      .innerJoin(behaviorTypesTable, eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id))
      .where(
        and(
          gte(catActivitiesTable.activity_date, startOfDay),
          lt(catActivitiesTable.activity_date, endOfDay)
        )
      )
      .execute();

    const { total_conspiracy_score, activity_count } = result[0];

    // Format date as YYYY-MM-DD for the date column
    const dateStr = startOfDay.toISOString().split('T')[0];

    // Check if a record already exists for this date
    const existingRecord = await db
      .select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, dateStr))
      .execute();

    let dailyRecord: DailyConspiracyLevel;

    if (existingRecord.length > 0) {
      // Update existing record
      const updated = await db
        .update(dailyConspiracyLevelsTable)
        .set({
          total_conspiracy_score: Number(total_conspiracy_score),
          activity_count: Number(activity_count),
          updated_at: new Date()
        })
        .where(eq(dailyConspiracyLevelsTable.date, dateStr))
        .returning()
        .execute();

      dailyRecord = {
        ...updated[0],
        date: new Date(updated[0].date)
      };
    } else {
      // Insert new record
      const inserted = await db
        .insert(dailyConspiracyLevelsTable)
        .values({
          date: dateStr,
          total_conspiracy_score: Number(total_conspiracy_score),
          activity_count: Number(activity_count)
        })
        .returning()
        .execute();

      dailyRecord = {
        ...inserted[0],
        date: new Date(inserted[0].date)
      };
    }

    return dailyRecord;
  } catch (error) {
    console.error('Failed to calculate daily conspiracy level:', error);
    throw error;
  }
}
