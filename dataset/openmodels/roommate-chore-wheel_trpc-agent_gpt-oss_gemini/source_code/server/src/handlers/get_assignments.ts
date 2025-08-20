import { db } from '../db';
import { assignmentsTable } from '../db/schema';
import { type Assignment } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Fetch assignments for a specific week.
 * Returns all assignments where the week_start column matches the provided date.
 */
export const getAssignments = async (weekStart: Date): Promise<Assignment[]> => {
  try {
    const results = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.week_start, weekStart.toISOString().split('T')[0]))
      .execute();

    // No numeric columns requiring conversion; return directly
    return results.map(r => ({ ...r, week_start: new Date(r.week_start) }));
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    throw error;
  }
};
