import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  try {
    // Insert activity record
    const result = await db.insert(activitiesTable)
      .values({
        cat_id: input.cat_id,
        activity_type: input.activity_type,
        description: input.description,
        conspiracy_score: input.conspiracy_score,
        recorded_at: input.recorded_at || new Date() // Use provided date or current time
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
}
