import { db } from '../db';
import { suspiciousActivitiesTable, activityTypesTable } from '../db/schema';
import { type ExpandedSuspiciousActivity } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getSuspiciousActivities(catId?: number, date?: string): Promise<ExpandedSuspiciousActivity[]> {
  try {
    // Base query with join to get activity type details
    const baseQuery = db.select({
      id: suspiciousActivitiesTable.id,
      cat_id: suspiciousActivitiesTable.cat_id,
      activity_type_id: suspiciousActivitiesTable.activity_type_id,
      notes: suspiciousActivitiesTable.notes,
      logged_at: suspiciousActivitiesTable.logged_at,
      activity_date: suspiciousActivitiesTable.activity_date,
      activity_name: activityTypesTable.name,
      activity_description: activityTypesTable.description,
      suspicion_points: activityTypesTable.suspicion_points
    })
    .from(suspiciousActivitiesTable)
    .innerJoin(activityTypesTable, eq(suspiciousActivitiesTable.activity_type_id, activityTypesTable.id));

    // Build conditions array for optional filters
    const conditions: SQL<unknown>[] = [];

    if (catId !== undefined) {
      conditions.push(eq(suspiciousActivitiesTable.cat_id, catId));
    }

    if (date !== undefined) {
      conditions.push(eq(suspiciousActivitiesTable.activity_date, date));
    }

    // Apply where clause if we have conditions
    const query = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query.execute();

    // Map results to match ExpandedSuspiciousActivity schema
    return results.map(result => ({
      id: result.id,
      cat_id: result.cat_id,
      activity_type_id: result.activity_type_id,
      notes: result.notes,
      logged_at: result.logged_at,
      activity_date: result.activity_date,
      activity_name: result.activity_name,
      activity_description: result.activity_description,
      suspicion_points: result.suspicion_points
    }));
  } catch (error) {
    console.error('Failed to get suspicious activities:', error);
    throw error;
  }
}
