import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type SearchJobsInput, type JobListing } from '../schema';
import { and, or, eq, ilike, desc, type SQL } from 'drizzle-orm';

export async function searchJobs(input: SearchJobsInput): Promise<JobListing[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // 1. Search by keyword in job title and description (case-insensitive)
    if (input.keyword) {
      const keywordCondition = or(
        ilike(jobListingsTable.title, `%${input.keyword}%`),
        ilike(jobListingsTable.description, `%${input.keyword}%`)
      );
      if (keywordCondition) {
        conditions.push(keywordCondition);
      }
    }

    // 2. Filter by engineering discipline if provided
    if (input.engineering_discipline) {
      conditions.push(eq(jobListingsTable.engineering_discipline, input.engineering_discipline));
    }

    // 3. Filter by location if provided (case-insensitive partial match)
    if (input.location) {
      conditions.push(ilike(jobListingsTable.location, `%${input.location}%`));
    }

    // Build query based on whether we have conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(jobListingsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(jobListingsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await db.select()
          .from(jobListingsTable)
          .orderBy(desc(jobListingsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    return results;
  } catch (error) {
    console.error('Job search failed:', error);
    throw error;
  }
}
