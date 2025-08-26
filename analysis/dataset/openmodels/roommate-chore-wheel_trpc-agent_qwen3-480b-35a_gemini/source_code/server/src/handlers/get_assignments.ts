import { db } from '../db';
import { membersTable, choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type Assignment } from '../schema';
import { eq } from 'drizzle-orm';

export const getAssignments = async (): Promise<Assignment[]> => {
  try {
    // Calculate the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() - daysSinceMonday);
    weekStartDate.setHours(0, 0, 0, 0); // Set to start of day

    // Format date as YYYY-MM-DD string for comparison with DATE column
    const weekStartDateString = weekStartDate.toISOString().split('T')[0];

    // Query assignments for the current week with joined member and chore data
    const results = await db.select({
      id: weeklyAssignmentsTable.id,
      week_start_date: weeklyAssignmentsTable.week_start_date,
      is_completed: weeklyAssignmentsTable.is_completed,
      completed_at: weeklyAssignmentsTable.completed_at,
      member_id: membersTable.id,
      member_name: membersTable.name,
      member_created_at: membersTable.created_at,
      chore_id: choresTable.id,
      chore_name: choresTable.name,
      chore_description: choresTable.description,
      chore_created_at: choresTable.created_at,
    })
      .from(weeklyAssignmentsTable)
      .innerJoin(membersTable, eq(weeklyAssignmentsTable.member_id, membersTable.id))
      .innerJoin(choresTable, eq(weeklyAssignmentsTable.chore_id, choresTable.id))
      .where(eq(weeklyAssignmentsTable.week_start_date, weekStartDateString))
      .execute();

    // Map results to Assignment format
    return results.map(result => ({
      id: result.id,
      week_start_date: new Date(result.week_start_date),
      is_completed: result.is_completed,
      completed_at: result.completed_at ? new Date(result.completed_at) : null,
      member: {
        id: result.member_id,
        name: result.member_name,
        created_at: new Date(result.member_created_at),
      },
      chore: {
        id: result.chore_id,
        name: result.chore_name,
        description: result.chore_description,
        created_at: new Date(result.chore_created_at),
      }
    }));
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    throw error;
  }
};
