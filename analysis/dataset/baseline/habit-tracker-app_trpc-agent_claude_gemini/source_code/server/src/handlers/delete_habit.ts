import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type DeleteHabitInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteHabit = async (input: DeleteHabitInput): Promise<{ success: boolean }> => {
  try {
    // Check if habit exists first
    const existingHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingHabit.length === 0) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    // Delete the habit (completions will be deleted automatically due to CASCADE)
    const result = await db.delete(habitsTable)
      .where(eq(habitsTable.id, input.id))
      .returning({ id: habitsTable.id })
      .execute();

    // Verify deletion was successful
    if (result.length === 0) {
      throw new Error(`Failed to delete habit with id ${input.id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Habit deletion failed:', error);
    throw error;
  }
};
