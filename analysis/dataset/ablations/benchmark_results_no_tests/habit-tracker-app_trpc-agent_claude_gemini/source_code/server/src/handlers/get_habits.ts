import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';

export const getHabits = async (): Promise<Habit[]> => {
  try {
    const results = await db.select()
      .from(habitsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    throw error;
  }
};
