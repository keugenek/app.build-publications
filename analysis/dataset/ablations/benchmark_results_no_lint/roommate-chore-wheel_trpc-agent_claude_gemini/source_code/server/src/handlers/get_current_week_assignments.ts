import { db } from '../db';
import { choresTable, weeklyAssignmentsTable } from '../db/schema';
import { type ChoreAssignmentView } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCurrentWeekAssignments(): Promise<ChoreAssignmentView[]> {
  try {
    // Calculate current week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days; else go back (day - 1) days
    
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0); // Set to start of day
    
    // Format date as YYYY-MM-DD for database query
    const weekStartString = currentWeekStart.toISOString().split('T')[0];

    // Query weekly assignments for current week with chore details
    const results = await db.select()
      .from(weeklyAssignmentsTable)
      .innerJoin(choresTable, eq(weeklyAssignmentsTable.chore_id, choresTable.id))
      .where(eq(weeklyAssignmentsTable.week_start, weekStartString))
      .execute();

    // Transform results to ChoreAssignmentView format
    return results.map(result => ({
      assignment_id: result.weekly_assignments.id,
      chore_id: result.weekly_assignments.chore_id,
      chore_name: result.chores.name,
      chore_description: result.chores.description,
      week_start: new Date(result.weekly_assignments.week_start),
      assigned_person: result.weekly_assignments.assigned_person,
      is_completed: result.weekly_assignments.is_completed,
      completed_at: result.weekly_assignments.completed_at
    }));
  } catch (error) {
    console.error('Failed to get current week assignments:', error);
    throw error;
  }
}
