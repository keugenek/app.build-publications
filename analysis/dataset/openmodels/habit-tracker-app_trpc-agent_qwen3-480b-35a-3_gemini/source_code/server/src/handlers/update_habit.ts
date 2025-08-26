import { type UpdateHabitInput, type Habit } from '../schema';
import { db } from '../db/index';
import { habitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const updateHabit = async (input: UpdateHabitInput): Promise<Habit> => {
  try {
    const [habit] = await db.update(habitsTable)
      .set({
        name: input.name,
        description: input.description
      })
      .where(eq(habitsTable.id, input.id))
      .returning();

    if (!habit) {
      throw new Error(`Habit with id ${input.id} not found`);
    }

    return habit;
  } catch (error) {
    console.error('Habit update failed:', error);
    throw error;
  }
};
