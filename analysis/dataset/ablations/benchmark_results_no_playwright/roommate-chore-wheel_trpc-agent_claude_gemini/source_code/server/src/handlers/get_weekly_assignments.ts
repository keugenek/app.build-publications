import { db } from '../db';
import { assignmentsTable, choresTable, membersTable } from '../db/schema';
import { type WeekQuery, type AssignmentWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getWeeklyAssignments = async (query: WeekQuery): Promise<AssignmentWithDetails[]> => {
  try {
    // Calculate week start date if not provided (current Monday)
    let weekStart: Date;
    if (query.week_start) {
      weekStart = new Date(query.week_start);
    } else {
      // Get current Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
    }

    // Convert to YYYY-MM-DD format for date comparison
    const weekStartString = weekStart.toISOString().split('T')[0];

    // Query assignments with joined chore and member data
    const results = await db.select()
      .from(assignmentsTable)
      .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
      .innerJoin(membersTable, eq(assignmentsTable.member_id, membersTable.id))
      .where(eq(assignmentsTable.week_start, weekStartString))
      .execute();

    // Transform the joined results to match AssignmentWithDetails schema
    return results.map(result => ({
      id: result.assignments.id,
      chore_id: result.assignments.chore_id,
      member_id: result.assignments.member_id,
      week_start: new Date(result.assignments.week_start),
      is_completed: result.assignments.is_completed,
      completed_at: result.assignments.completed_at,
      created_at: result.assignments.created_at,
      chore: {
        id: result.chores.id,
        name: result.chores.name,
        description: result.chores.description,
        created_at: result.chores.created_at
      },
      member: {
        id: result.members.id,
        name: result.members.name,
        created_at: result.members.created_at
      }
    }));
  } catch (error) {
    console.error('Get weekly assignments failed:', error);
    throw error;
  }
};
