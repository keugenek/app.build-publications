import { db } from '../db';
import { habitChecksTable } from '../db/schema';
import { type HabitCheck } from '../schema';

/**
 * Fetch all habit checks from the database.
 * Returns an array of {@link HabitCheck} objects with `check_date` converted to a Date instance.
 */
export const getHabitChecks = async (): Promise<HabitCheck[]> => {
  try {
    // Query all rows from habit_checks table
    const rows = await db.select().from(habitChecksTable).execute();

    // Convert `check_date` (stored as DATE) to a JavaScript Date object
    return rows.map((row) => ({
      ...row,
      check_date:
        new Date(row.check_date as any),
    }));
  } catch (error) {
    console.error('Failed to fetch habit checks:', error);
    throw error;
  }
};
