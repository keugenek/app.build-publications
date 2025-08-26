import { db } from '../db';
import { weeklyChoreAssignmentsTable } from '../db/schema';
import { type GetUserChoresInput, type WeeklyChoreAssignment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getUserChores = async (input: GetUserChoresInput): Promise<WeeklyChoreAssignment[]> => {
  try {
    const result = await db.select()
      .from(weeklyChoreAssignmentsTable)
      .where(
        and(
          eq(weeklyChoreAssignmentsTable.user_id, input.user_id),
          eq(weeklyChoreAssignmentsTable.week_start_date, input.week_start_date.toISOString().split('T')[0])
        )
      )
      .execute();

    // Convert date strings back to Date objects
    return result.map(assignment => ({
      ...assignment,
      week_start_date: new Date(assignment.week_start_date),
      completed_at: assignment.completed_at ? new Date(assignment.completed_at) : null,
      assigned_at: new Date(assignment.assigned_at)
    }));
  } catch (error) {
    console.error('Failed to fetch user chores:', error);
    throw error;
  }
};
