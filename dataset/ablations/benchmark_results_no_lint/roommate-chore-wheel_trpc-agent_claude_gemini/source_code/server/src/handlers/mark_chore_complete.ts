import { db } from '../db';
import { weeklyAssignmentsTable } from '../db/schema';
import { type MarkChoreCompleteInput, type WeeklyAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export const markChoreComplete = async (input: MarkChoreCompleteInput): Promise<WeeklyAssignment> => {
  try {
    // Update the weekly assignment to mark it as completed
    const result = await db.update(weeklyAssignmentsTable)
      .set({
        is_completed: true,
        completed_at: new Date()
      })
      .where(eq(weeklyAssignmentsTable.id, input.assignment_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Weekly assignment with id ${input.assignment_id} not found`);
    }

    // Convert the date string to Date object to match schema expectation
    const assignment = result[0];
    return {
      ...assignment,
      week_start: new Date(assignment.week_start)
    };
  } catch (error) {
    console.error('Mark chore complete failed:', error);
    throw error;
  }
};
