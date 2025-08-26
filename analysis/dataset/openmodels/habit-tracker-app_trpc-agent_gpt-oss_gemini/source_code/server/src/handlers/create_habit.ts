import { type CreateHabitInput, type Habit } from '../schema';

/**
 * Placeholder handler for creating a new habit.
 * In a real implementation this would insert a new row into the `habits` table.
 */
import { db } from '../db';
import { habitsTable } from '../db/schema';

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    const result = await db
      .insert(habitsTable)
      .values({ name: input.name })
      .returning()
      .execute();

    // Drizzle returns array of inserted rows
    const habit = result[0];
    return {
      id: habit.id,
      name: habit.name,
      created_at: habit.created_at,
    } as Habit;
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
};
