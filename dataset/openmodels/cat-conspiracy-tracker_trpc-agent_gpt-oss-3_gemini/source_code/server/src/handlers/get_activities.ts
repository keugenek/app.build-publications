import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type Activity } from '../schema';

/**
 * Handler to fetch all logged cat activities.
 */
export const getActivities = async (): Promise<Activity[]> => {
  // Query all activities from the database
  const rows = await db.select().from(activitiesTable).execute();
  // Return rows as Activity objects (types match schema)
  return rows.map(row => ({
    id: row.id,
    type: row.type,
    points: row.points,
    created_at: row.created_at,
  }));
};
