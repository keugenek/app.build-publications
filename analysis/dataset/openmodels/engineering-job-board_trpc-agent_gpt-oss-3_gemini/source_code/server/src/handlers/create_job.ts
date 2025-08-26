import { type CreateJobInput, type Job } from '../schema';
import { db } from '../db';
import { jobsTable } from '../db/schema';

/**
 * Handler for creating a job posting.
 * Inserts the job into the database and returns the newly created job record.
 */
export const createJob = async (input: CreateJobInput): Promise<Job> => {
  try {
    const result = await db
      .insert(jobsTable)
      .values({
        title: input.title,
        company: input.company,
        location: input.location,
        discipline: input.discipline,
        description: input.description,
        application_contact: input.application_contact,
      })
      .returning()
      .execute();

    // Drizzle returns an array with the inserted rows
    const job = result[0];
    return job as Job;
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};
