import { db } from '../db';
import { assignmentsTable, weeksTable, participantsTable, choresTable } from '../db/schema';
import { type GetAssignmentsByWeekInput, type AssignmentWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getAssignmentsByWeek(input: GetAssignmentsByWeekInput): Promise<AssignmentWithDetails[]> {
  try {
    // Query assignments with all related data using joins
    const results = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .innerJoin(participantsTable, eq(assignmentsTable.participant_id, participantsTable.id))
      .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
      .where(
        and(
          eq(weeksTable.year, input.year),
          eq(weeksTable.week_number, input.week_number)
        )
      )
      .execute();

    // Transform the joined results to match AssignmentWithDetails schema
    return results.map(result => ({
      id: result.assignments.id,
      week: {
        id: result.weeks.id,
        year: result.weeks.year,
        week_number: result.weeks.week_number,
        start_date: new Date(result.weeks.start_date),
        end_date: new Date(result.weeks.end_date),
        created_at: result.weeks.created_at
      },
      participant: {
        id: result.participants.id,
        name: result.participants.name,
        created_at: result.participants.created_at
      },
      chore: {
        id: result.chores.id,
        name: result.chores.name,
        created_at: result.chores.created_at
      },
      is_completed: result.assignments.is_completed,
      completed_at: result.assignments.completed_at,
      created_at: result.assignments.created_at
    }));
  } catch (error) {
    console.error('Failed to get assignments by week:', error);
    throw error;
  }
}
