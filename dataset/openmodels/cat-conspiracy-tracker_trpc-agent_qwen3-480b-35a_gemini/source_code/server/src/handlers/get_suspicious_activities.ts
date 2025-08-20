import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { type SuspiciousActivity } from '../schema';

export const getSuspiciousActivities = async (): Promise<SuspiciousActivity[]> => {
  try {
    const results = await db.select()
      .from(suspiciousActivitiesTable)
      .orderBy(suspiciousActivitiesTable.created_at)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(activity => ({
      ...activity,
      conspiracy_points: activity.conspiracy_points, // Integer - no conversion needed
      recorded_at: activity.recorded_at, // Date fields are already Date objects
      created_at: activity.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch suspicious activities:', error);
    throw error;
  }
};
