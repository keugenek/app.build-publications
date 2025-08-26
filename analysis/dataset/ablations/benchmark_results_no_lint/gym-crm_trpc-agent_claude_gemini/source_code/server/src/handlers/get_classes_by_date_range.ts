import { db } from '../db';
import { classesTable } from '../db/schema';
import { type GetClassesDateRangeInput, type Class } from '../schema';
import { and, gte, lte } from 'drizzle-orm';

export async function getClassesByDateRange(input: GetClassesDateRangeInput): Promise<Class[]> {
  try {
    // Build the query to filter classes within the date range
    const results = await db.select()
      .from(classesTable)
      .where(
        and(
          gte(classesTable.start_time, input.start_date),
          lte(classesTable.start_time, input.end_date)
        )
      )
      .execute();

    // Return the classes - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Failed to fetch classes by date range:', error);
    throw error;
  }
}
