import { db } from '../db';
import { weeklyAssignmentsTable } from '../db/schema';
import { type UpdateAssignmentInput, type WeeklyAssignment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAssignment = async (input: UpdateAssignmentInput): Promise<WeeklyAssignment> => {
  try {
    const completedAt = input.is_completed ? new Date() : null;
    
    const result = await db.update(weeklyAssignmentsTable)
      .set({
        is_completed: input.is_completed,
        completed_at: completedAt
      })
      .where(eq(weeklyAssignmentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Assignment with id ${input.id} not found`);
    }

    // Convert the database result to match our schema
    const dbAssignment = result[0];
    
    // Ensure week_start_date is a Date object
    const weekStartDate = new Date(dbAssignment.week_start_date);
    
    return {
      id: dbAssignment.id,
      member_id: dbAssignment.member_id,
      chore_id: dbAssignment.chore_id,
      week_start_date: weekStartDate,
      is_completed: dbAssignment.is_completed,
      completed_at: dbAssignment.completed_at
    };
  } catch (error) {
    console.error('Assignment update failed:', error);
    throw error;
  }
};
