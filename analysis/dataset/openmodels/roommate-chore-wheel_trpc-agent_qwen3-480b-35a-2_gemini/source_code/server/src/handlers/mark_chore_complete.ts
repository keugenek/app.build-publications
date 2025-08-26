import { db } from '../db';
import { weeklyChoreAssignmentsTable } from '../db/schema';
import { type MarkChoreCompleteInput, type WeeklyChoreAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export const markChoreComplete = async (input: MarkChoreCompleteInput): Promise<WeeklyChoreAssignment> => {
  try {
    const result = await db.update(weeklyChoreAssignmentsTable)
      .set({
        is_completed: true,
        completed_at: new Date()
      })
      .where(eq(weeklyChoreAssignmentsTable.id, input.assignment_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Chore assignment with id ${input.assignment_id} not found`);
    }

    const assignment = result[0];
    
    // Convert date fields back to Date objects
    return {
      ...assignment,
      week_start_date: new Date(assignment.week_start_date),
      assigned_at: new Date(assignment.assigned_at),
      completed_at: assignment.completed_at ? new Date(assignment.completed_at) : null
    };
  } catch (error) {
    console.error('Failed to mark chore as complete:', error);
    throw error;
  }
};
