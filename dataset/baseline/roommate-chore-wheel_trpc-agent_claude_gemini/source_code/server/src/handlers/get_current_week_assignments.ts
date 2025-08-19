import { db } from '../db';
import { assignmentsTable, weeksTable, participantsTable, choresTable } from '../db/schema';
import { type AssignmentWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

// Helper function to calculate ISO week number and year
function getISOWeek(date: Date): { year: number; week: number } {
  // Copy date so original is not mutated
  const d = new Date(date);
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return {
    year: d.getUTCFullYear(),
    week: weekNo
  };
}

export async function getCurrentWeekAssignments(): Promise<AssignmentWithDetails[]> {
  try {
    // Calculate current ISO week and year
    const now = new Date();
    const { year, week } = getISOWeek(now);

    // Query assignments for current week with all related data
    const results = await db.select()
      .from(assignmentsTable)
      .innerJoin(weeksTable, eq(assignmentsTable.week_id, weeksTable.id))
      .innerJoin(participantsTable, eq(assignmentsTable.participant_id, participantsTable.id))
      .innerJoin(choresTable, eq(assignmentsTable.chore_id, choresTable.id))
      .where(
        and(
          eq(weeksTable.year, year),
          eq(weeksTable.week_number, week)
        )
      )
      .execute();

    // Transform joined results to match AssignmentWithDetails schema
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
    console.error('Failed to get current week assignments:', error);
    throw error;
  }
}
