import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type Activity } from '../schema';
import { eq } from 'drizzle-orm';

export const getActivities = async (catId?: number): Promise<Activity[]> => {
  try {
    // Build the query conditionally
    const results = catId !== undefined
      ? await db.select()
          .from(activitiesTable)
          .where(eq(activitiesTable.cat_id, catId))
          .execute()
      : await db.select()
          .from(activitiesTable)
          .execute();

    // No numeric conversion needed - all fields are already proper types
    // (integers stay integers, timestamps are Date objects)
    return results;
  } catch (error) {
    console.error('Failed to get activities:', error);
    throw error;
  }
};
