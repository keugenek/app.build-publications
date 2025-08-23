import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type Job, type FilterJobsInput } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getJobs = async (filters?: FilterJobsInput): Promise<Job[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    if (filters?.discipline) {
      conditions.push(eq(jobsTable.discipline, filters.discipline));
    }
    
    if (filters?.location) {
      conditions.push(eq(jobsTable.location, filters.location));
    }
    
    // Execute query with or without filters
    if (conditions.length > 0) {
      const results = await db.select()
        .from(jobsTable)
        .where(and(...conditions))
        .execute();
      return results;
    } else {
      const results = await db.select().from(jobsTable).execute();
      return results;
    }
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    throw error;
  }
};
