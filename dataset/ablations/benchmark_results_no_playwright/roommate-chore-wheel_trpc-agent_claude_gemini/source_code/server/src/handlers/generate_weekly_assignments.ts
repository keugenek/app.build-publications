import { db } from '../db';
import { assignmentsTable, choresTable, membersTable } from '../db/schema';
import { type GenerateWeeklyAssignmentsInput, type Assignment } from '../schema';
import { eq } from 'drizzle-orm';

export const generateWeeklyAssignments = async (input: GenerateWeeklyAssignmentsInput): Promise<Assignment[]> => {
  try {
    // Check if assignments already exist for this week
    const existingAssignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.week_start, input.week_start))
      .execute();

    if (existingAssignments.length > 0) {
      throw new Error(`Assignments already exist for week starting ${input.week_start}`);
    }

    // Fetch all chores
    const chores = await db.select()
      .from(choresTable)
      .execute();

    if (chores.length === 0) {
      throw new Error('No chores available to assign');
    }

    // Fetch all members
    const members = await db.select()
      .from(membersTable)
      .execute();

    if (members.length === 0) {
      throw new Error('No members available to assign chores to');
    }

    // Randomly distribute chores among members
    const assignmentData = chores.map((chore) => {
      const randomMemberIndex = Math.floor(Math.random() * members.length);
      const selectedMember = members[randomMemberIndex];
      
      return {
        chore_id: chore.id,
        member_id: selectedMember.id,
        week_start: input.week_start,
        is_completed: false,
        completed_at: null
      };
    });

    // Create assignment records
    const result = await db.insert(assignmentsTable)
      .values(assignmentData)
      .returning()
      .execute();

    // Convert week_start from string to Date for response schema compatibility
    return result.map(assignment => ({
      ...assignment,
      week_start: new Date(assignment.week_start),
      completed_at: assignment.completed_at ? new Date(assignment.completed_at) : null,
      created_at: new Date(assignment.created_at)
    }));
  } catch (error) {
    console.error('Weekly assignment generation failed:', error);
    throw error;
  }
};
