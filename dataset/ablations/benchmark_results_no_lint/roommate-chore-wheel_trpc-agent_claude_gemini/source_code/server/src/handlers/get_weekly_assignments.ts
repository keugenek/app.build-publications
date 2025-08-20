import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type GetWeeklyAssignmentsInput, type ChoreAssignmentView } from '../schema';
import { eq } from 'drizzle-orm';

export async function getWeeklyAssignments(input: GetWeeklyAssignmentsInput): Promise<ChoreAssignmentView[]> {
  try {
    // Convert Date to string format for database query
    const weekStartStr = input.week_start.toISOString().split('T')[0];
    
    // Query weekly assignments joined with chores for the specific week
    const results = await db.select()
      .from(weeklyAssignmentsTable)
      .innerJoin(choresTable, eq(weeklyAssignmentsTable.chore_id, choresTable.id))
      .where(eq(weeklyAssignmentsTable.week_start, weekStartStr))
      .execute();

    // Transform the joined results into the expected ChoreAssignmentView format
    return results.map(result => ({
      assignment_id: result.weekly_assignments.id,
      chore_id: result.chores.id,
      chore_name: result.chores.name,
      chore_description: result.chores.description,
      week_start: new Date(result.weekly_assignments.week_start),
      assigned_person: result.weekly_assignments.assigned_person,
      is_completed: result.weekly_assignments.is_completed,
      completed_at: result.weekly_assignments.completed_at
    }));
  } catch (error) {
    console.error('Failed to get weekly assignments:', error);
    throw error;
  }
}
