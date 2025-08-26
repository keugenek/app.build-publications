import { db } from '../db';
import { weeksTable, assignmentsTable } from '../db/schema';
import { type Week } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getWeeksWithAssignments(): Promise<Week[]> {
  try {
    // Get all weeks that have assignments, ordered by year desc, week_number desc
    // for easy navigation (most recent first)
    const results = await db.select({
      id: weeksTable.id,
      year: weeksTable.year,
      week_number: weeksTable.week_number,
      start_date: weeksTable.start_date,
      end_date: weeksTable.end_date,
      created_at: weeksTable.created_at,
    })
      .from(weeksTable)
      .innerJoin(assignmentsTable, eq(weeksTable.id, assignmentsTable.week_id))
      .groupBy(
        weeksTable.id,
        weeksTable.year,
        weeksTable.week_number,
        weeksTable.start_date,
        weeksTable.end_date,
        weeksTable.created_at
      )
      .orderBy(desc(weeksTable.year), desc(weeksTable.week_number))
      .execute();

    // Convert date strings to Date objects for proper typing
    return results.map(week => ({
      ...week,
      start_date: new Date(week.start_date),
      end_date: new Date(week.end_date),
      created_at: new Date(week.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch weeks with assignments:', error);
    throw error;
  }
}
