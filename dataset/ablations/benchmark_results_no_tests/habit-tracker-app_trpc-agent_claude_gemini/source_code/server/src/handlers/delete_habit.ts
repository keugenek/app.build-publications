import { db } from '../db';
import { habitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteHabit = async (habitId: number): Promise<void> => {
  try {
    // Delete the habit - cascade will automatically delete associated tracking data
    await db.delete(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();
  } catch (error) {
    console.error('Habit deletion failed:', error);
    throw error;
  }
};
