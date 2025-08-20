import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type Job, type JobFilter } from '../schema';
import { and, eq, ilike, or, SQL } from 'drizzle-orm';

export const getJobs = async (filter?: JobFilter): Promise<Job[]> => {
  try {
    // Build conditions array with proper typing
    const conditions: SQL<unknown>[] = [];

    // Apply discipline filter
    if (filter?.discipline) {
      conditions.push(eq(jobsTable.discipline, filter.discipline));
    }

    // Apply location filter
    if (filter?.location) {
      conditions.push(eq(jobsTable.location, filter.location));
    }

    // Apply remote filter
    if (filter?.is_remote !== undefined) {
      conditions.push(eq(jobsTable.is_remote, filter.is_remote));
    }

    // Apply search filter (search in title, company, description)
    if (filter?.search) {
      const searchTerm = `%${filter.search}%`;
      const searchCondition = or(
        ilike(jobsTable.title, searchTerm),
        ilike(jobsTable.company, searchTerm),
        ilike(jobsTable.description, searchTerm)
      );
      
      // Only add the condition if it's not undefined
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build query based on conditions
    const query = conditions.length > 0
      ? db.select().from(jobsTable).where(and(...conditions)).orderBy(jobsTable.created_at)
      : db.select().from(jobsTable).orderBy(jobsTable.created_at);

    // Execute query and get results
    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(job => ({
      ...job,
      salary_min: job.salary_min !== null ? parseFloat(job.salary_min) : null,
      salary_max: job.salary_max !== null ? parseFloat(job.salary_max) : null
    }));
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    throw error;
  }
};