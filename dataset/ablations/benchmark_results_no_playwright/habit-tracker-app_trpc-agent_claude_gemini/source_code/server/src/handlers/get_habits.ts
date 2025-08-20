import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';
import { desc } from 'drizzle-orm';

export const getHabits = async (): Promise<Habit[]> => {
  try {
    // Fetch all habits ordered by creation date (newest first)
    const results = await db.select()
      .from(habitsTable)
      .orderBy(desc(habitsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    throw error;
  }
};
