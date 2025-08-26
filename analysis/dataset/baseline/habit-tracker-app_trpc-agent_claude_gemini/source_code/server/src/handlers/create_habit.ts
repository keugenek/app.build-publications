import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type CreateHabitInput, type Habit } from '../schema';

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    // Insert habit record
    const result = await db.insert(habitsTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Habit creation failed:', error);
    throw error;
  }
};
