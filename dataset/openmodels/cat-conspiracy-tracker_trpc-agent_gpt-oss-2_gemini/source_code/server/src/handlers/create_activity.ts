import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { type CreateActivityInput, type ActivityLog } from '../schema';

/**
 * Handler for creating a new cat activity log.
 * Persists the activity to the database and returns the created record.
 */
export async function createActivity(
  input: CreateActivityInput,
): Promise<ActivityLog> {
  try {
    const result = await db
      .insert(activitiesTable)
      .values({
        cat_name: input.cat_name,
        activity_type: input.activity_type,
        description: input.description ?? null,
        score: input.score,
      })
      .returning()
      .execute();

    const activity = result[0];
    // Drizzle returns timestamp columns as Date objects, no conversion needed.
    return activity as ActivityLog;
  } catch (error) {
    console.error('Failed to create activity:', error);
    throw error;
  }
}
