import { db } from '../db';
import { assignmentsTable, weeksTable, participantsTable, choresTable } from '../db/schema';
import { type CompleteAssignmentInput, type AssignmentWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const completeAssignment = async (input: CompleteAssignmentInput): Promise<AssignmentWithDetails> => {
  try {
    // First, check if the assignment exists and get its current state
    const existingAssignments = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .innerJoin(participantsTable, eq(assignmentsTable.participant_id, participantsTable.id))
      .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
      .where(eq(assignmentsTable.id, input.assignment_id))
      .execute();

    if (existingAssignments.length === 0) {
      throw new Error(`Assignment with ID ${input.assignment_id} not found`);
    }

    const existingAssignment = existingAssignments[0];

    // Check if assignment is already completed
    if (existingAssignment.assignments.is_completed) {
      throw new Error(`Assignment with ID ${input.assignment_id} is already completed`);
    }

    // Update the assignment to mark it as completed
    const now = new Date();
    const updatedResults = await db.update(assignmentsTable)
      .set({
        is_completed: true,
        completed_at: now
      })
      .where(eq(assignmentsTable.id, input.assignment_id))
      .returning()
      .execute();

    if (updatedResults.length === 0) {
      throw new Error(`Failed to update assignment with ID ${input.assignment_id}`);
    }

    // Return the assignment with full details
    return {
      id: existingAssignment.assignments.id,
      week: {
        id: existingAssignment.weeks.id,
        year: existingAssignment.weeks.year,
        week_number: existingAssignment.weeks.week_number,
        start_date: new Date(existingAssignment.weeks.start_date),
        end_date: new Date(existingAssignment.weeks.end_date),
        created_at: existingAssignment.weeks.created_at
      },
      participant: {
        id: existingAssignment.participants.id,
        name: existingAssignment.participants.name,
        created_at: existingAssignment.participants.created_at
      },
      chore: {
        id: existingAssignment.chores.id,
        name: existingAssignment.chores.name,
        created_at: existingAssignment.chores.created_at
      },
      is_completed: true,
      completed_at: now,
      created_at: existingAssignment.assignments.created_at
    };
  } catch (error) {
    console.error('Assignment completion failed:', error);
    throw error;
  }
};
