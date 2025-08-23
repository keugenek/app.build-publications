import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type CreateJobInput, type Job } from '../schema';

export const createJob = async (input: CreateJobInput): Promise<Job> => {
  try {
    // Insert job record
    const result = await db.insert(jobsTable)
      .values({
        title: input.title,
        description: input.description,
        discipline: input.discipline,
        location: input.location,
        company_name: input.company_name,
        application_link: input.application_link
      })
      .returning()
      .execute();

    const job = result[0];
    return {
      ...job,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at)
    };
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};
