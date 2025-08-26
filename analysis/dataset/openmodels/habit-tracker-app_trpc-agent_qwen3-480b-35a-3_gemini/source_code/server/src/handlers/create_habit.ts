import { type CreateHabitInput, type Habit } from '../schema';
import { db } from '../db';
import { habitsTable } from '../db/schema';

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  try {
    // Validate input using Zod schema
    const validatedInput = input; // Zod validation happens at the route level
    
    // Insert habit record
    const result = await db.insert(habitsTable)
      .values({
        name: validatedInput.name,
        description: validatedInput.description
      })
      .returning()
      .execute();

    const habit = result[0];
    return habit;
  } catch (error) {
    console.error('Habit creation failed:', error);
    throw error;
  }
};
