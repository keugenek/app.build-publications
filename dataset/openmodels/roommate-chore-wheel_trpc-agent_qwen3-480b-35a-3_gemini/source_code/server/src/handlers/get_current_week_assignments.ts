import { db } from '../db';
import { weeklyAssignmentsTable, choresTable, usersTable } from '../db/schema';
import { type CurrentWeekAssignment } from '../schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { startOfWeek, endOfWeek } from 'date-fns';

export const getCurrentWeekAssignments = async (): Promise<CurrentWeekAssignment[]> => {
  try {
    // Get the start and end of the current week (Monday to Sunday)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    // Query assignments for the current week with chore and user information
    const results = await db
      .select({
        assignment_id: weeklyAssignmentsTable.id,
        week_start_date: weeklyAssignmentsTable.week_start_date,
        chore_name: choresTable.name,
        chore_description: choresTable.description,
        user_name: usersTable.name,
        is_completed: weeklyAssignmentsTable.is_completed,
        completed_at: weeklyAssignmentsTable.completed_at
      })
      .from(weeklyAssignmentsTable)
      .innerJoin(choresTable, eq(weeklyAssignmentsTable.chore_id, choresTable.id))
      .innerJoin(usersTable, eq(weeklyAssignmentsTable.user_id, usersTable.id))
      .where(
        and(
          gte(weeklyAssignmentsTable.week_start_date, weekStart.toISOString().split('T')[0]),
          lte(weeklyAssignmentsTable.week_start_date, weekEnd.toISOString().split('T')[0])
        )
      )
      .execute();

    // Map results to match the expected output schema and convert date strings to Date objects
    return results.map(result => ({
      assignment_id: result.assignment_id,
      week_start_date: new Date(result.week_start_date),
      chore_name: result.chore_name,
      chore_description: result.chore_description,
      user_name: result.user_name,
      is_completed: result.is_completed,
      completed_at: result.completed_at ? new Date(result.completed_at) : null
    }));
  } catch (error) {
    console.error('Failed to fetch current week assignments:', error);
    throw error;
  }
};
