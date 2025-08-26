import { db } from '../db';
import { weeklyAssignmentsTable } from '../db/schema';
import { type UpdateAssignmentCompletionInput, type WeeklyAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAssignmentCompletion = async (input: UpdateAssignmentCompletionInput): Promise<WeeklyAssignment> => {
  try {
    // Update the assignment completion status
    const result = await db.update(weeklyAssignmentsTable)
      .set({
        is_completed: input.is_completed,
        completed_at: input.is_completed ? new Date() : null
      })
      .where(eq(weeklyAssignmentsTable.id, input.assignment_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Assignment with ID ${input.assignment_id} not found`);
    }

    // Convert date fields to proper Date objects before returning
    const assignment = result[0];
    return {
      ...assignment,
      week_start_date: new Date(assignment.week_start_date),
      created_at: new Date(assignment.created_at),
      completed_at: assignment.completed_at ? new Date(assignment.completed_at) : null
    };
  } catch (error) {
    console.error('Assignment completion update failed:', error);
    throw error;
  }
};
