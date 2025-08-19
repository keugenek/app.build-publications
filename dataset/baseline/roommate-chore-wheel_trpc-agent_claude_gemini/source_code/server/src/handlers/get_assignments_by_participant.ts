import { db } from '../db';
import { assignmentsTable, weeksTable, participantsTable, choresTable } from '../db/schema';
import { type GetAssignmentsByParticipantInput, type AssignmentWithDetails } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getAssignmentsByParticipant(input: GetAssignmentsByParticipantInput): Promise<AssignmentWithDetails[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by participant_id
    conditions.push(eq(participantsTable.id, input.participant_id));

    // Add optional year filter
    if (input.year !== undefined) {
      conditions.push(eq(weeksTable.year, input.year));
    }

    // Add optional week_number filter
    if (input.week_number !== undefined) {
      conditions.push(eq(weeksTable.week_number, input.week_number));
    }

    // If no year or week filters provided, get current week
    if (input.year === undefined && input.week_number === undefined) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentWeekNumber = getISOWeekNumber(now);
      
      conditions.push(eq(weeksTable.year, currentYear));
      conditions.push(eq(weeksTable.week_number, currentWeekNumber));
    }

    // Build query with joins and where clause
    const query = db.select({
      assignment: assignmentsTable,
      week: weeksTable,
      participant: participantsTable,
      chore: choresTable
    })
    .from(assignmentsTable)
    .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
    .innerJoin(participantsTable, eq(assignmentsTable.participant_id, participantsTable.id))
    .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
    .where(conditions.length === 1 ? conditions[0] : and(...conditions));

    // Execute query
    const results = await query.execute();

    // Transform results to match AssignmentWithDetails schema
    return results.map(result => ({
      id: result.assignment.id,
      week: {
        id: result.week.id,
        year: result.week.year,
        week_number: result.week.week_number,
        start_date: new Date(result.week.start_date),
        end_date: new Date(result.week.end_date),
        created_at: result.week.created_at
      },
      participant: {
        id: result.participant.id,
        name: result.participant.name,
        created_at: result.participant.created_at
      },
      chore: {
        id: result.chore.id,
        name: result.chore.name,
        created_at: result.chore.created_at
      },
      is_completed: result.assignment.is_completed,
      completed_at: result.assignment.completed_at,
      created_at: result.assignment.created_at
    }));
  } catch (error) {
    console.error('Failed to get assignments by participant:', error);
    throw error;
  }
}

// Helper function to get ISO week number
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
