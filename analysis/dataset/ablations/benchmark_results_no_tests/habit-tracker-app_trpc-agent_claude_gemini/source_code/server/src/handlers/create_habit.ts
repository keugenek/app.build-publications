import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput, type Habit } from '../schema';

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    // Insert habit record
    const result = await db.insert(habitsTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created habit
    const habit = result[0];
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      created_at: habit.created_at
    };
  } catch (error) {
    console.error('Habit creation failed:', error);
    throw error;
  }
};
