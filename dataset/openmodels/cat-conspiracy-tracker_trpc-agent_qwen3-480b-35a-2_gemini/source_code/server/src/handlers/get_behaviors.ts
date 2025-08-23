import { db } from '../db';
import { behaviorsTable } from '../db/schema';
import { type Behavior } from '../schema';

export const getBehaviors = async (): Promise<Behavior[]> => {
  try {
    const results = await db.select()
      .from(behaviorsTable)
      .execute();

    // Convert numeric fields back to numbers before returning and ensure proper typing
    return results.map(behavior => ({
      id: behavior.id,
      cat_id: behavior.cat_id,
      behavior_type: behavior.behavior_type as Behavior['behavior_type'], // Cast to proper enum type
      description: behavior.description,
      intensity: behavior.intensity, // Integer column - no conversion needed
      duration_minutes: behavior.duration_minutes, // Integer column - no conversion needed
      recorded_at: behavior.recorded_at,
      created_at: behavior.created_at
    }));
  } catch (error) {
    console.error('Fetching behaviors failed:', error);
    throw error;
  }
};
