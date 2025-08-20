import { type SearchJobsInput, type Job } from '../schema';
import { db } from '../db';
import { jobsTable } from '../db/schema';
import { eq, and, SQL } from 'drizzle-orm';

/**
 * Handler to search/filter job listings based on discipline and location.
 */
export const searchJobs = async (input: SearchJobsInput): Promise<Job[]> => {
  // Build base query
  let query: any = db.select().from(jobsTable);

  // Collect conditions based on provided filters
  const conditions: SQL<unknown>[] = [];
  if (input.discipline !== undefined) {
    conditions.push(eq(jobsTable.discipline, input.discipline));
  }
  if (input.location !== undefined) {
    conditions.push(eq(jobsTable.location, input.location));
  }

  // Apply where clause if any conditions exist
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions));
  }

  // Execute query
  const rows = await query.execute() as any[];

  // Convert numeric fields back to numbers and handle optional salary
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    discipline: row.discipline,
    location: row.location,
    salary: row.salary !== null && row.salary !== undefined ? parseFloat(row.salary) : undefined,
    posted_at: row.posted_at,
  }));
};
