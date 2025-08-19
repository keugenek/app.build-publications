import { db } from '../db';
import { catActivitiesTable, dailyConspiracyLevelsTable, behaviorTypesTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export async function deleteCatActivity(id: number): Promise<void> {
  try {
    // First, get the activity to find out its date before deleting
    const activity = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, id))
      .limit(1)
      .execute();

    if (activity.length === 0) {
      throw new Error(`Cat activity with id ${id} not found`);
    }

    const activityDate = activity[0].activity_date;
    
    // Delete the cat activity
    await db.delete(catActivitiesTable)
      .where(eq(catActivitiesTable.id, id))
      .execute();

    // Recalculate daily conspiracy level for the activity's date
    await recalculateDailyConspiracyLevel(activityDate);
  } catch (error) {
    console.error('Cat activity deletion failed:', error);
    throw error;
  }
}

async function recalculateDailyConspiracyLevel(activityDate: Date): Promise<void> {
  // Get the date in YYYY-MM-DD format for comparison
  const dateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

  // Get all activities for this date with their conspiracy scores
  const activitiesForDate = await db.select({
    conspiracy_score: behaviorTypesTable.conspiracy_score
  })
    .from(catActivitiesTable)
    .innerJoin(behaviorTypesTable, eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id))
    .where(sql`DATE(${catActivitiesTable.activity_date}) = ${dateOnly.toISOString().split('T')[0]}`)
    .execute();

  // Calculate totals
  const totalScore = activitiesForDate.reduce((sum, activity) => sum + activity.conspiracy_score, 0);
  const activityCount = activitiesForDate.length;

  if (activityCount === 0) {
    // No activities left for this date, delete the daily conspiracy level entry
    await db.delete(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, dateOnly.toISOString().split('T')[0]))
      .execute();
  } else {
    // Update or insert the daily conspiracy level
    const existingLevel = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(eq(dailyConspiracyLevelsTable.date, dateOnly.toISOString().split('T')[0]))
      .limit(1)
      .execute();

    if (existingLevel.length > 0) {
      // Update existing record
      await db.update(dailyConspiracyLevelsTable)
        .set({
          total_conspiracy_score: totalScore,
          activity_count: activityCount,
          updated_at: new Date()
        })
        .where(eq(dailyConspiracyLevelsTable.id, existingLevel[0].id))
        .execute();
    } else {
      // Insert new record (shouldn't happen in delete scenario, but for completeness)
      await db.insert(dailyConspiracyLevelsTable)
        .values({
          date: dateOnly.toISOString().split('T')[0],
          total_conspiracy_score: totalScore,
          activity_count: activityCount
        })
        .execute();
    }
  }
}
