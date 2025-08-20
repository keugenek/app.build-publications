import { db } from '../db';
import { activityTypesTable } from '../db/schema';
import { type CreateActivityTypeInput, type ActivityType } from '../schema';

export async function createActivityType(input: CreateActivityTypeInput): Promise<ActivityType> {
  try {
    // Insert activity type record
    const result = await db.insert(activityTypesTable)
      .values({
        name: input.name,
        description: input.description,
        suspicion_points: input.suspicion_points
      })
      .returning()
      .execute();

    const activityType = result[0];
    return {
      ...activityType
    };
  } catch (error) {
    console.error('Activity type creation failed:', error);
    throw error;
  }
}
