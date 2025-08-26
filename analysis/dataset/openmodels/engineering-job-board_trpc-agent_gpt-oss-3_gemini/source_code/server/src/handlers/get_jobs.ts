import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type Job, type GetJobsInput } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

/**
 * Fetch jobs from the database applying optional filters.
 *
 * - If `input` is omitted or contains no filter values the function returns all jobs.
 * - Filters are applied using proper Drizzle‑ORM operators.
 * - The query is built step‑by‑step, applying `.where()` before any other modifiers.
 */
export const getJobs = async (input?: GetJobsInput): Promise<Job[]> => {
  // Start with a base SELECT query.
  let query: any = db.select().from(jobsTable);

  // Collect conditional filter expressions.
  const conditions: SQL<unknown>[] = [];

  if (input) {
    // `discipline` can be null – treat null as "no filter".
    if (input.discipline !== undefined && input.discipline !== null) {
      conditions.push(eq(jobsTable.discipline, input.discipline));
    }
    // `location` is optional; only add when defined.
    if (input.location !== undefined) {
      conditions.push(eq(jobsTable.location, input.location));
    }
  }

  // Apply the WHERE clause only when we have conditions.
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions)); // Spread operator is required!
  }

  // Execute the query and return the raw rows.
  const results = await query.execute();
  return results;
};
