import { db } from '../db';
import { habitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteHabit(habitId: number): Promise<{ success: boolean }> {
  try {
    // First, verify the habit exists
    const existingHabit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    if (existingHabit.length === 0) {
      throw new Error(`Habit with ID ${habitId} not found`);
    }

    // Delete the habit (cascade delete will remove associated check-ins)
    await db.delete(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Habit deletion failed:', error);
    throw error;
  }
}
