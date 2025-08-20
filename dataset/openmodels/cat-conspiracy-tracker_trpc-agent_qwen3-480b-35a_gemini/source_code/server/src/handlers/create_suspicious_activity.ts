import { db } from '../db';
import { suspiciousActivitiesTable } from '../db/schema';
import { type CreateSuspiciousActivityInput, type SuspiciousActivity } from '../schema';

export const createSuspiciousActivity = async (input: CreateSuspiciousActivityInput): Promise<SuspiciousActivity> => {
  try {
    // Insert suspicious activity record
    const result = await db.insert(suspiciousActivitiesTable)
      .values({
        description: input.description,
        activity_type: input.activity_type,
        conspiracy_points: input.conspiracy_points,
        recorded_at: new Date(), // Using current time for recording
        created_at: new Date() // Using current time for creation
      })
      .returning()
      .execute();

    // Return the created activity
    const activity = result[0];
    return {
      ...activity,
      recorded_at: activity.recorded_at,
      created_at: activity.created_at
    };
  } catch (error) {
    console.error('Suspicious activity creation failed:', error);
    throw error;
  }
};
