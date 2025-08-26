import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable } from '../db/schema';
import { type GetActivitiesByDateRangeInput, type ActivityWithBehaviorType } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

export async function getActivitiesByDateRange(input: GetActivitiesByDateRangeInput): Promise<ActivityWithBehaviorType[]> {
  try {
    // Create end of day timestamp for end_date to include entire day
    const endOfDay = new Date(input.end_date);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query with inner join to get behavior type details
    const results = await db.select()
      .from(catActivitiesTable)
      .innerJoin(
        behaviorTypesTable,
        eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id)
      )
      .where(
        and(
          gte(catActivitiesTable.activity_date, input.start_date),
          lte(catActivitiesTable.activity_date, endOfDay)
        )
      )
      .orderBy(desc(catActivitiesTable.activity_date))
      .execute();

    // Transform joined results to match ActivityWithBehaviorType schema
    return results.map(result => ({
      id: result.cat_activities.id,
      behavior_type_id: result.cat_activities.behavior_type_id,
      description: result.cat_activities.description,
      cat_name: result.cat_activities.cat_name,
      activity_date: result.cat_activities.activity_date,
      created_at: result.cat_activities.created_at,
      behavior_type: {
        id: result.behavior_types.id,
        name: result.behavior_types.name,
        conspiracy_score: result.behavior_types.conspiracy_score,
        is_custom: result.behavior_types.is_custom,
        created_at: result.behavior_types.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get activities by date range:', error);
    throw error;
  }
}
