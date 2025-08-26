import { db } from '../db';
import { habitsTable, habitCheckInsTable } from '../db/schema';
import { type HabitCheckIn } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getHabitCheckIns(habitId: number): Promise<HabitCheckIn[]> {
  try {
    // 1. Verify the habit exists
    const habit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, habitId))
      .execute();

    if (habit.length === 0) {
      throw new Error(`Habit with id ${habitId} not found`);
    }

    // 2. Fetch all check-ins for the habit ordered by completed_at date (most recent first)
    const checkIns = await db.select()
      .from(habitCheckInsTable)
      .where(eq(habitCheckInsTable.habit_id, habitId))
      .orderBy(desc(habitCheckInsTable.completed_at))
      .execute();

    // 3. Return the list of check-ins
    return checkIns;
  } catch (error) {
    console.error('Failed to fetch habit check-ins:', error);
    throw error;
  }
}
