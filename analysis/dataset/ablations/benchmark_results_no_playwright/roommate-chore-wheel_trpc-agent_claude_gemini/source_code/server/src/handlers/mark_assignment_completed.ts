import { db } from '../db';
import { assignmentsTable } from '../db/schema';
import { type MarkAssignmentCompletedInput, type Assignment } from '../schema';
import { eq } from 'drizzle-orm';

export const markAssignmentCompleted = async (input: MarkAssignmentCompletedInput): Promise<Assignment> => {
  try {
    // Update the assignment to mark as completed
    const result = await db.update(assignmentsTable)
      .set({
        is_completed: true,
        completed_at: new Date()
      })
      .where(eq(assignmentsTable.id, input.assignment_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Assignment with id ${input.assignment_id} not found`);
    }

    // Convert week_start from string to Date to match schema
    const assignment = result[0];
    return {
      ...assignment,
      week_start: new Date(assignment.week_start)
    };
  } catch (error) {
    console.error('Assignment completion failed:', error);
    throw error;
  }
};
