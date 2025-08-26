import { db } from '../db';
import { habitsTable, habitCompletionsTable } from '../db/schema';
import { type RemoveHabitCompletionInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function removeHabitCompletion(input: RemoveHabitCompletionInput): Promise<{ success: boolean }> {
  try {
    // First check if habit exists
    const habits = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();

    if (habits.length === 0) {
      throw new Error(`Habit with id ${input.habit_id} not found`);
    }

    // Format the date to ensure proper comparison (date only, no time)
    const completedDate = new Date(input.completed_at);
    const dateString = completedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find and delete the completion record for the specific habit and date
    const result = await db.delete(habitCompletionsTable)
      .where(
        and(
          eq(habitCompletionsTable.habit_id, input.habit_id),
          eq(habitCompletionsTable.completed_at, dateString)
        )
      )
      .execute();

    // Return success regardless of whether a record was actually deleted
    // This makes the operation idempotent - calling it multiple times has same effect
    return { success: true };
  } catch (error) {
    console.error('Remove habit completion failed:', error);
    throw error;
  }
}
