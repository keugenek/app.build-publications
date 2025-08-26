import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';

// Map activity types to their suspicion scores
const SUSPICION_SCORES: Record<string, number> = {
  'Prolonged Staring': 5,
  'Midnight Zoomies': 3,
  'Leaving \'Gifts\' (dead insects, toys, etc.)': 10,
  'Silent Judgment': 7,
  'Plotting on the Keyboard': 8
};

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  try {
    // Get the activity date - default to today if not provided
    const activityDate = input.date || new Date();

    // Insert the activity record into the database
    const result = await db.insert(activitiesTable)
      .values({
        description: input.description,
        suspicion_score: SUSPICION_SCORES[input.activity_type],
        activity_type: input.activity_type,
        date: activityDate.toISOString().split('T')[0] // Convert to YYYY-MM-DD format for date column
      })
      .returning()
      .execute();

    // Return the inserted activity
    const activity = result[0];
    return {
      ...activity,
      // Convert date fields to Date objects
      created_at: new Date(activity.created_at),
      date: new Date(activity.date)
    };
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
};
