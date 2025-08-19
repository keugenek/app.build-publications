import { db } from '../db';
import { habitsTable } from '../db/schema';
import { type Habit } from '../schema';
import { asc } from 'drizzle-orm';

export const getHabits = async (): Promise<Habit[]> => {
  try {
    // Query all habits from the database, ordered by name for consistent results
    const results = await db.select()
      .from(habitsTable)
      .orderBy(asc(habitsTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    throw error;
  }
};
