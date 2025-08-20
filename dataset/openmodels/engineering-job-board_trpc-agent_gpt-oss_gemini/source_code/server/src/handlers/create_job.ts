import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput, type Job } from '../schema';

/**
 * Handler for creating a job listing.
 * Inserts a new record into the `jobs` table and returns the created job.
 * Handles numeric conversion for the `salary` column (numeric -> string on insert,
 * string -> number on return).
 */
export const createJob = async (input: CreateJobInput): Promise<Job> => {
  try {
    const result = await db
      .insert(jobsTable)
      .values({
        title: input.title,
        description: input.description, // nullable field, pass as‑is (null allowed)
        discipline: input.discipline,
        location: input.location,
        // Convert number to string for numeric column; omit field if undefined
        salary: input.salary !== undefined ? input.salary.toString() : undefined,
        // posted_at defaults to now in the schema
      })
      .returning()
      .execute();

    const job = result[0];
    // Convert numeric salary back to number if present
    return {
      ...job,
      salary: job.salary !== null && job.salary !== undefined ? parseFloat(job.salary) : undefined,
    } as Job;
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};
