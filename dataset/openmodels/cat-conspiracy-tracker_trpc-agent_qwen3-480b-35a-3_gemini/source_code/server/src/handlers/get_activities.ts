import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type Activity } from '../schema';

export const getActivities = async (): Promise<Activity[]> => {
  try {
    // Fetch all activities from the database
    const results = await db.select()
      .from(activitiesTable)
      .orderBy(activitiesTable.created_at)
      .execute();

    // Convert date fields back to Date objects before returning
    return results.map(activity => ({
      ...activity,
      suspicion_score: activity.suspicion_score, // Already a number in the database
      created_at: new Date(activity.created_at), // Convert to Date object
      date: new Date(activity.date) // Convert to Date object
    }));
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
};
