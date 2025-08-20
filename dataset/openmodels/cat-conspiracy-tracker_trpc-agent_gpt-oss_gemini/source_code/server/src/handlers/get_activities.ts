import { type Activity } from '../schema';

import { db } from '../db';
import { activitiesTable } from '../db/schema';

// Fetch all activities from the database with proper numeric conversion.
export const getActivities = async (): Promise<Activity[]> => {
  try {
    const rows = await db.select().from(activitiesTable).execute();
    // Convert numeric fields back to numbers before returning.
    return rows.map(row => ({
      ...row,
      suspicion_score: parseFloat(row.suspicion_score), // numeric stored as string
      // Date columns are returned as Date objects by Drizzle, but ensure proper type.
      activity_date: new Date(row.activity_date),
      created_at: new Date(row.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
};
