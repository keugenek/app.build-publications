import { type Habit } from '../schema';
import { db } from '../db';
import { habitsTable } from '../db/schema';

/**
 * Fetch all habits from the database.
 */
export const getHabits = async (): Promise<Habit[]> => {
  try {
    const results = await db.select().from(habitsTable).execute();
    // No numeric columns to convert, just ensure Date type is correct (already Date)
    return results.map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description ?? null,
      created_at: habit.created_at,
    }));
  } catch (error) {
    console.error('Failed to get habits:', error);
    throw error;
  }
};
