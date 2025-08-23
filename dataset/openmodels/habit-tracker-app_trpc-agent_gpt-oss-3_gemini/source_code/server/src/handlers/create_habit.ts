import { type CreateHabitInput, type Habit } from '../schema';
import { db } from '../db';
import { habitsTable } from '../db/schema';

/**
 * Placeholder implementation for creating a new habit.
 * In a real implementation this would insert a record into the `habits` table.
 */
export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    const result = await db
      .insert(habitsTable)
      .values({
        name: input.name,
        // If description is undefined, omit to let DB store NULL
        ...(input.description !== undefined ? { description: input.description } : {}),
      })
      .returning()
      .execute();
    // Drizzle returns an array of inserted rows
    const habit = result[0];
    return habit;
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
};
