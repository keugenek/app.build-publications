import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type CreateBehaviorTypeInput, type BehaviorType } from '../schema';

export const createBehaviorType = async (input: CreateBehaviorTypeInput): Promise<BehaviorType> => {
  try {
    // Insert behavior type record
    const result = await db.insert(behaviorTypesTable)
      .values({
        name: input.name,
        conspiracy_score: input.conspiracy_score,
        is_custom: input.is_custom
      })
      .returning()
      .execute();

    const behaviorType = result[0];
    return behaviorType;
  } catch (error) {
    console.error('Behavior type creation failed:', error);
    throw error;
  }
};
