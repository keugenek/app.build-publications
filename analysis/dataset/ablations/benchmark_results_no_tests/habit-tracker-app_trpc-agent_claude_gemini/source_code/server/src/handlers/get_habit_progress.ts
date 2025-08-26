import { db } from '../db';
import { habitTrackingTable, habitsTable } from '../db/schema';
import { type GetHabitProgressInput, type HabitTracking } from '../schema';
import { eq, gte, lte, and, asc, type SQL } from 'drizzle-orm';

export async function getHabitProgress(input: GetHabitProgressInput): Promise<HabitTracking[]> {
  try {
    // First verify the habit exists
    const habit = await db.select()
      .from(habitsTable)
      .where(eq(habitsTable.id, input.habit_id))
      .execute();

    if (habit.length === 0) {
      throw new Error(`Habit with id ${input.habit_id} not found`);
    }

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [
      eq(habitTrackingTable.habit_id, input.habit_id)
    ];

    if (input.start_date) {
      conditions.push(gte(habitTrackingTable.date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(habitTrackingTable.date, input.end_date));
    }

    // Build and execute query in one step
    const results = await db.select()
      .from(habitTrackingTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(habitTrackingTable.date))
      .execute();

    // Convert date strings to Date objects to match schema
    return results.map(result => ({
      ...result,
      date: new Date(result.date)
    }));
  } catch (error) {
    console.error('Get habit progress failed:', error);
    throw error;
  }
}
