import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';

/**
 * Fetch all habits from the database.
 * Returns an array of Habit objects.
 */
export const getHabits = async (): Promise<Habit[]> => {
  try {
    const rows = await db.select().from(habitsTable).execute();
    return rows;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    throw error;
  }
};
