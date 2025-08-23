import { db } from '../db';
import { behaviorsTable } from '../db/schema';
import { type RecordBehaviorInput, type Behavior } from '../schema';

export const recordBehavior = async (input: RecordBehaviorInput): Promise<Behavior> => {
  try {
    // Insert behavior record
    const result = await db.insert(behaviorsTable)
      .values({
        cat_id: input.cat_id,
        behavior_type: input.behavior_type,
        description: input.description,
        intensity: input.intensity,
        duration_minutes: input.duration_minutes,
        recorded_at: input.recorded_at || new Date()
      })
      .returning()
      .execute();

    return result[0] as Behavior;
  } catch (error) {
    console.error('Behavior recording failed:', error);
    throw error;
  }
};
