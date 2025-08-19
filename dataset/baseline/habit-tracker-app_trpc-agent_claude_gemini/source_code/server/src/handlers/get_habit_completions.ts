import { db } from '../db';
import { habitCompletionsTable } from '../db/schema';
import { type GetHabitCompletionsInput, type HabitCompletion } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getHabitCompletions = async (input: GetHabitCompletionsInput): Promise<HabitCompletion[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by habit_id if provided
    if (input.habit_id !== undefined) {
      conditions.push(eq(habitCompletionsTable.habit_id, input.habit_id));
    }

    // Filter by start_date if provided
    if (input.start_date !== undefined) {
      conditions.push(gte(habitCompletionsTable.completed_at, input.start_date.toISOString().split('T')[0]));
    }

    // Filter by end_date if provided
    if (input.end_date !== undefined) {
      conditions.push(lte(habitCompletionsTable.completed_at, input.end_date.toISOString().split('T')[0]));
    }

    // Build query with all conditions and ordering
    const query = db.select()
      .from(habitCompletionsTable)
      .where(conditions.length === 0 ? undefined : 
             conditions.length === 1 ? conditions[0] : 
             and(...conditions))
      .orderBy(desc(habitCompletionsTable.completed_at));

    const results = await query.execute();

    // Convert date strings back to Date objects and return
    return results.map(result => ({
      ...result,
      completed_at: new Date(result.completed_at),
      created_at: result.created_at // Already a Date object from timestamp column
    }));
  } catch (error) {
    console.error('Failed to get habit completions:', error);
    throw error;
  }
};
