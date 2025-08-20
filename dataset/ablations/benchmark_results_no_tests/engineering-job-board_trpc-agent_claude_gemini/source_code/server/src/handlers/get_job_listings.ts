import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type JobListing, type JobListingFilters } from '../schema';
import { eq, ilike, and, desc } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getJobListings = async (filters?: JobListingFilters): Promise<JobListing[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.engineering_discipline) {
      conditions.push(eq(jobListingsTable.engineering_discipline, filters.engineering_discipline));
    }

    if (filters?.location) {
      conditions.push(ilike(jobListingsTable.location, `%${filters.location}%`));
    }

    // Build query with conditional WHERE clause
    const baseQuery = db.select().from(jobListingsTable);
    
    const query = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply ordering and execute
    const results = await query.orderBy(desc(jobListingsTable.created_at)).execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch job listings:', error);
    throw error;
  }
};
