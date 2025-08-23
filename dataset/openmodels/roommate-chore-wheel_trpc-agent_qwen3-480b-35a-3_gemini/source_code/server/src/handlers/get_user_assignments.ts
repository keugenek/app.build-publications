import { db } from '../db';
import { weeklyAssignmentsTable, choresTable, usersTable } from '../db/schema';
import { type CurrentWeekAssignment } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const getUserAssignments = async (userId: number): Promise<CurrentWeekAssignment[]> => {
  try {
    // Calculate the start and end of the current week (Monday to Sunday)
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday as start
    
    // Calculate Monday of current week
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Calculate Sunday of current week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Format dates to match database date format (YYYY-MM-DD)
    const formatDateString = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    const weekStartString = formatDateString(weekStart);
    const weekEndString = formatDateString(weekEnd);
    
    // Query assignments for the current week and user
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
          eq(weeklyAssignmentsTable.user_id, userId),
          gte(weeklyAssignmentsTable.week_start_date, weekStartString),
          lte(weeklyAssignmentsTable.week_start_date, weekEndString)
        )
      )
      .execute();

    // Map results to the expected schema format, converting date strings to Date objects
    return results.map(result => ({
      assignment_id: result.assignment_id,
      week_start_date: new Date(result.week_start_date),
      chore_name: result.chore_name,
      chore_description: result.chore_description,
      user_name: result.user_name,
      is_completed: result.is_completed,
      completed_at: result.completed_at
    }));
  } catch (error) {
    console.error('Failed to fetch user assignments:', error);
    throw error;
  }
};
