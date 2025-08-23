import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteHabit = async (id: number): Promise<void> => {
  try {
    // First delete habit completions
    await db.delete(habitCompletionsTable)
      .where(eq(habitCompletionsTable.habit_id, id));
    
    // Then delete the habit itself
    await db.delete(habitsTable)
      .where(eq(habitsTable.id, id));
  } catch (error) {
    console.error('Habit deletion failed:', error);
    throw error;
  }
};
