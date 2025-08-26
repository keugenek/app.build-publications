import { db } from '../db';
import { choresTable } from '../db/schema';
import { type UpdateChoreCompletionInput, type Chore } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChoreCompletion = async (input: UpdateChoreCompletionInput): Promise<Chore> => {
  try {
    // Update the chore's completion status
    const result = await db.update(choresTable)
      .set({ is_completed: input.is_completed })
      .where(eq(choresTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Chore with id ${input.id} not found`);
    }

    // Return the updated chore
    return result[0];
  } catch (error) {
    console.error('Chore completion update failed:', error);
    throw error;
  }
};
