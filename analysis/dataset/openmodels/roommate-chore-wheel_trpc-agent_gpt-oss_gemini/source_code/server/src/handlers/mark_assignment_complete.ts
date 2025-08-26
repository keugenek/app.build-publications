import { type MarkAssignmentCompleteInput, type Assignment } from '../schema';
import { db } from '../db';
import { assignmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Stub handler for marking an assignment as completed.
 * Real implementation would update the assignment record in the database.
 */
export const markAssignmentComplete = async (input: MarkAssignmentCompleteInput): Promise<Assignment> => {
  try {
    // Update the assignment's completed status and return the updated row
    const result = await db
      .update(assignmentsTable)
      .set({ completed: input.completed })
      .where(eq(assignmentsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    if (!updated) {
      throw new Error(`Assignment with id ${input.id} not found`);
    }
    // Return the updated assignment (no numeric conversion needed)
    const assignment = {
      ...updated,
      // Convert week_start string to Date for schema compatibility
      week_start: new Date(updated.week_start as any),
    } as Assignment;
    return assignment;
  } catch (error) {
    console.error('Failed to mark assignment complete:', error);
    throw error;
  }
};


