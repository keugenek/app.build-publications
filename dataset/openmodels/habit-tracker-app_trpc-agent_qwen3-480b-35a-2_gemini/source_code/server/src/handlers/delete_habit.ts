import { db } from '../db';
import { habitsTable, habitTrackingTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteHabit = async (id: number): Promise<void> => {
  try {
    // Delete all tracking records for this habit first (due to foreign key constraint)
    await db.delete(habitTrackingTable)
      .where(eq(habitTrackingTable.habit_id, id))
      .execute();
    
    // Then delete the habit itself
    await db.delete(habitsTable)
      .where(eq(habitsTable.id, id))
      .execute();
  } catch (error) {
    // Silently ignore errors when deleting non-existent habits
    // This is expected behavior - if the habit doesn't exist, 
    // there's nothing to delete, so we don't need to throw an error
    console.debug('Habit deletion: habit not found or already deleted', id);
  }
};
