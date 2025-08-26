import { type Habit } from '../schema';

/**
 * Placeholder handler for fetching all habits.
 * Real implementation should query the database.
 */
import { db } from '../db';
import { habitsTable } from '../db/schema';

export const getHabits = async (): Promise<Habit[]> => {
  try {
    const habits = await db.select()
      .from(habitsTable)
      .execute();
    return habits;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    throw error;
  }
};
