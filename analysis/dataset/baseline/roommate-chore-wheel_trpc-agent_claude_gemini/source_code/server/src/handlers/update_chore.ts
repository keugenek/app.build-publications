import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreInput, type Chore } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChore = async (input: UpdateChoreInput): Promise<Chore> => {
  try {
    // Check if chore exists first
    const existingChore = await db.select()
      .from(choresTable)
      .where(eq(choresTable.id, input.id))
      .execute();

    if (existingChore.length === 0) {
      throw new Error(`Chore with id ${input.id} not found`);
    }

    // Build update object - only include fields that are provided
    const updateData: { name?: string } = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // If no fields to update, return existing chore
    if (Object.keys(updateData).length === 0) {
      return existingChore[0];
    }

    // Update chore record
    const result = await db.update(choresTable)
      .set(updateData)
      .where(eq(choresTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chore update failed:', error);
    throw error;
  }
};
