import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput, type Habit } from '../schema';

/**
 * Creates a new habit record in the database.
 * Returns the inserted habit with proper types.
 */
export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    const result = await db
      .insert(habitsTable)
      .values({
        name: input.name,
        // description can be null; if undefined treat as null (though schema disallows undefined)
        description: input.description ?? null,
      })
      .returning()
      .execute();

    // Drizzle returns an array; the inserted row is the first element
    const habit = result[0];
    return habit;
  } catch (error) {
    console.error('Failed to create habit:', error);
    throw error;
  }
};
