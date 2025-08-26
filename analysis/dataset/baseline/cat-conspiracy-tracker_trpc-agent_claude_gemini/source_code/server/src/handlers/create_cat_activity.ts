import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { type CreateCatActivityInput, type CatActivity } from '../schema';
import { eq, sum, count, and, gte, lte } from 'drizzle-orm';

export async function createCatActivity(input: CreateCatActivityInput): Promise<CatActivity> {
  try {
    // First verify the behavior_type_id exists
    const behaviorTypeExists = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, input.behavior_type_id))
      .execute();

    if (behaviorTypeExists.length === 0) {
      throw new Error(`Behavior type with id ${input.behavior_type_id} does not exist`);
    }

    // Insert the cat activity
    const result = await db.insert(catActivitiesTable)
      .values({
        behavior_type_id: input.behavior_type_id,
        description: input.description,
        cat_name: input.cat_name,
        activity_date: input.activity_date
      })
      .returning()
      .execute();

    const activity = result[0];

    // Update the daily conspiracy level for the activity date
    await updateDailyConspiracyLevel(input.activity_date);

    return activity;
  } catch (error) {
    console.error('Cat activity creation failed:', error);
    throw error;
  }
}

async function updateDailyConspiracyLevel(activityDate: Date): Promise<void> {
  // Calculate the date range for the activity date (start and end of day)
  const startOfDay = new Date(activityDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(activityDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all activities for the date and calculate total conspiracy score
  const dailyStats = await db.select({
    totalScore: sum(behaviorTypesTable.conspiracy_score),
    activityCount: count(catActivitiesTable.id)
  })
  .from(catActivitiesTable)
  .innerJoin(behaviorTypesTable, eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id))
  .where(
    and(
      gte(catActivitiesTable.activity_date, startOfDay),
      lte(catActivitiesTable.activity_date, endOfDay)
    )
  )
  .execute();

  const totalScore = Number(dailyStats[0].totalScore) || 0;
  const activityCount = Number(dailyStats[0].activityCount) || 0;

  // Convert activity date to date string for the date column
  const dateString = activityDate.toISOString().split('T')[0];

  // Check if daily conspiracy level already exists for this date
  const existingLevel = await db.select()
    .from(dailyConspiracyLevelsTable)
    .where(eq(dailyConspiracyLevelsTable.date, dateString))
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
    // Create new record
    await db.insert(dailyConspiracyLevelsTable)
      .values({
        date: dateString,
        total_conspiracy_score: totalScore,
        activity_count: activityCount
      })
      .execute();
  }
}
