import { type MarkHabitCompletionInput } from '../schema';
import { db } from '../db';
import { habitCompletionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const markHabitCompletion = async (input: MarkHabitCompletionInput): Promise<void> => {
  try {
    // Format date as string for database operations
    const dateString = input.date.toISOString().split('T')[0];
    
    // Check if completion already exists for this habit and date
    const existingCompletion = await db.select()
      .from(habitCompletionsTable)
      .where(and(
        eq(habitCompletionsTable.habit_id, input.habit_id),
        eq(habitCompletionsTable.date, dateString)
      ))
      .execute();
    
    if (existingCompletion.length > 0) {
      // Update existing completion
      await db.update(habitCompletionsTable)
        .set({ completed: input.completed })
        .where(and(
          eq(habitCompletionsTable.habit_id, input.habit_id),
          eq(habitCompletionsTable.date, dateString)
        ))
        .execute();
    } else {
      // Create new completion
      await db.insert(habitCompletionsTable)
        .values({
          habit_id: input.habit_id,
          date: dateString,
          completed: input.completed
        })
        .execute();
    }
  } catch (error) {
    console.error('Habit completion marking failed:', error);
    throw error;
  }
};
