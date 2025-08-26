import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type UpdateBehaviorTypeInput, type BehaviorType } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateBehaviorType = async (input: UpdateBehaviorTypeInput): Promise<BehaviorType> => {
  try {
    // First check if the behavior type exists and is custom
    const existingBehaviorType = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, input.id))
      .execute();

    if (existingBehaviorType.length === 0) {
      throw new Error('Behavior type not found');
    }

    if (!existingBehaviorType[0].is_custom) {
      throw new Error('Cannot update predefined behavior types');
    }

    // Build update data object with only provided fields
    const updateData: Partial<{
      name: string;
      conspiracy_score: number;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.conspiracy_score !== undefined) {
      updateData.conspiracy_score = input.conspiracy_score;
    }

    // If no fields to update, return existing record
    if (Object.keys(updateData).length === 0) {
      return existingBehaviorType[0];
    }

    // Update the behavior type
    const result = await db.update(behaviorTypesTable)
      .set(updateData)
      .where(eq(behaviorTypesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Behavior type update failed:', error);
    throw error;
  }
};
