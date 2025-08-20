import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { type ActivityType } from '../schema';
import { desc } from 'drizzle-orm';

export const getActivityTypes = async (): Promise<ActivityType[]> => {
  try {
    // Fetch all activity types ordered by creation date (newest first)
    const results = await db.select()
      .from(activityTypesTable)
      .orderBy(desc(activityTypesTable.created_at))
      .execute();

    // Return activity types with proper type conversion
    return results.map(activityType => ({
      id: activityType.id,
      name: activityType.name,
      description: activityType.description,
      suspicion_points: activityType.suspicion_points,
      created_at: activityType.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch activity types:', error);
    throw error;
  }
};
