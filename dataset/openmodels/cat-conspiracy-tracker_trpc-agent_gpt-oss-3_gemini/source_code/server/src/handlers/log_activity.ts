import { type LogActivityInput, type Activity } from '../schema';
import { db } from '../db';
import { activitiesTable } from '../db/schema';

// Mapping of activity type to points
const activityPointsMap: Record<Activity['type'], number> = {
  PROLONGED_STARING: 5,
  DEAD_INSECT_GIFT: 10,
  LIVE_ANIMAL_GIFT: 20,
  MIDNIGHT_ZOOMIES: 8,
  IGNORING_COMMANDS: 4,
  INTENSE_GROOMING_GLANCE: 7,
};

/**
 * Logs a new suspicious cat activity.
 * Inserts a row into the `activities` table and returns the created record.
 */
export const logActivity = async (input: LogActivityInput): Promise<Activity> => {
  const points = activityPointsMap[input.type] ?? 0;

  try {
    // Insert activity. No numeric conversion needed for integer columns.
    const result = await db
      .insert(activitiesTable)
      .values({
        type: input.type,
        points,
      })
      .returning()
      .execute();

    const record = result[0];
    // Drizzle returns Date for timestamp columns, but guard just in case.
    const createdAt = record.created_at instanceof Date ? record.created_at : new Date(record.created_at as unknown as string);

    const activity: Activity = {
      id: record.id,
      type: record.type,
      points: record.points,
      created_at: createdAt,
    };
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
};
