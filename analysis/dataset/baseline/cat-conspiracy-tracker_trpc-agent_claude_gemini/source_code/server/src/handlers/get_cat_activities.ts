import { db } from '../db';
import { catActivitiesTable, behaviorTypesTable } from '../db/schema';
import { type ActivityWithBehaviorType } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getCatActivities(): Promise<ActivityWithBehaviorType[]> {
  try {
    // Query with join to get activities with their behavior type information
    const results = await db.select()
      .from(catActivitiesTable)
      .innerJoin(behaviorTypesTable, eq(catActivitiesTable.behavior_type_id, behaviorTypesTable.id))
      .orderBy(desc(catActivitiesTable.activity_date))
      .execute();

    // Map the joined results to the expected structure
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
    console.error('Failed to get cat activities:', error);
    throw error;
  }
}
