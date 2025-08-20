import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type SearchJobListingsInput, type JobListing } from '../schema';
import { eq, ilike, or, and, desc, type SQL } from 'drizzle-orm';

export async function searchJobListings(input: SearchJobListingsInput): Promise<JobListing[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by engineering discipline (exact match)
    if (input.engineering_discipline) {
      conditions.push(eq(jobListingsTable.engineering_discipline, input.engineering_discipline));
    }

    // Filter by location (case-insensitive partial match)
    if (input.location) {
      conditions.push(ilike(jobListingsTable.location, `%${input.location}%`));
    }

    // Filter by search term (case-insensitive search in title, company_name, and description)
    if (input.search_term) {
      const searchPattern = `%${input.search_term}%`;
      conditions.push(
        or(
          ilike(jobListingsTable.title, searchPattern),
          ilike(jobListingsTable.company_name, searchPattern),
          ilike(jobListingsTable.description, searchPattern)
        )!
      );
    }

    // Execute query with proper conditional logic
    const results = conditions.length === 0
      ? await db.select()
          .from(jobListingsTable)
          .orderBy(desc(jobListingsTable.created_at))
          .execute()
      : await db.select()
          .from(jobListingsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(jobListingsTable.created_at))
          .execute();

    return results;
  } catch (error) {
    console.error('Job listings search failed:', error);
    throw error;
  }
}
