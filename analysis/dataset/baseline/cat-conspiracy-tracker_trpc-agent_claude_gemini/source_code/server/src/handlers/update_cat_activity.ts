import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable, dailyConspiracyLevelsTable } from '../db/schema';
import { type UpdateCatActivityInput, type CatActivity } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function updateCatActivity(input: UpdateCatActivityInput): Promise<CatActivity> {
  try {
    // First, get the current activity to check for date/behavior changes
    const [currentActivity] = await db.select()
      .from(catActivitiesTable)
      .where(eq(catActivitiesTable.id, input.id))
      .execute();

    if (!currentActivity) {
      throw new Error(`Cat activity with id ${input.id} not found`);
    }

    // Validate behavior_type_id if provided
    if (input.behavior_type_id !== undefined) {
      const [behaviorType] = await db.select()
        .from(behaviorTypesTable)
        .where(eq(behaviorTypesTable.id, input.behavior_type_id))
        .execute();

      if (!behaviorType) {
        throw new Error(`Behavior type with id ${input.behavior_type_id} not found`);
      }
    }

    // Update the activity
    const updateValues: Partial<typeof catActivitiesTable.$inferInsert> = {};
    
    if (input.behavior_type_id !== undefined) {
      updateValues.behavior_type_id = input.behavior_type_id;
    }
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    if (input.cat_name !== undefined) {
      updateValues.cat_name = input.cat_name;
    }
    if (input.activity_date !== undefined) {
      updateValues.activity_date = input.activity_date;
    }

    const [updatedActivity] = await db.update(catActivitiesTable)
      .set(updateValues)
      .where(eq(catActivitiesTable.id, input.id))
      .returning()
      .execute();

    // Recalculate daily conspiracy levels if date or behavior type changed
    const datesToRecalculate = new Set<string>();
    
    // Add original date
    const originalDateStr = currentActivity.activity_date.toISOString().split('T')[0];
    datesToRecalculate.add(originalDateStr);
    
    // Add new date if changed
    if (input.activity_date && 
        input.activity_date.toISOString().split('T')[0] !== originalDateStr) {
      const newDateStr = input.activity_date.toISOString().split('T')[0];
      datesToRecalculate.add(newDateStr);
    }

    // Recalculate conspiracy levels for affected dates
    for (const dateStr of datesToRecalculate) {
      await recalculateDailyConspiracyLevel(dateStr);
    }

    return updatedActivity;
  } catch (error) {
    console.error('Cat activity update failed:', error);
    throw error;
  }
}

async function recalculateDailyConspiracyLevel(dateStr: string): Promise<void> {
  // Calculate total conspiracy score and activity count for the date
  const result = await db.select({
    totalScore: sql<number>`CAST(COALESCE(SUM(${behaviorTypesTable.conspiracy_score}), 0) AS INTEGER)`,
    activityCount: sql<number>`CAST(COUNT(${catActivitiesTable.id}) AS INTEGER)`
  })
    .from(catActivitiesTable)
    .innerJoin(behaviorTypesTable, eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id))
    .where(sql`DATE(${catActivitiesTable.activity_date}) = ${dateStr}`)
    .execute();

  const { totalScore, activityCount } = result[0];

  if (activityCount === 0) {
    // Delete the record if no activities exist for this date
    await db.delete(dailyConspiracyLevelsTable)
      .where(sql`${dailyConspiracyLevelsTable.date} = ${dateStr}`)
      .execute();
  } else {
    // Check if record exists for this date
    const [existingLevel] = await db.select()
      .from(dailyConspiracyLevelsTable)
      .where(sql`${dailyConspiracyLevelsTable.date} = ${dateStr}`)
      .execute();

    if (existingLevel) {
      // Update existing record
      await db.update(dailyConspiracyLevelsTable)
        .set({
          total_conspiracy_score: totalScore,
          activity_count: activityCount,
          updated_at: new Date()
        })
        .where(sql`${dailyConspiracyLevelsTable.date} = ${dateStr}`)
        .execute();
    } else {
      // Insert new record
      await db.insert(dailyConspiracyLevelsTable)
        .values({
          date: dateStr,
          total_conspiracy_score: totalScore,
          activity_count: activityCount,
          updated_at: new Date()
        })
        .execute();
    }
  }
}
