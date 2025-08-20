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
        company: input.company,
        location: input.location,
        discipline: input.discipline,
        salary_min: input.salary_min?.toString(), // Convert number to string for numeric column
        salary_max: input.salary_max?.toString(), // Convert number to string for numeric column
        is_remote: input.is_remote ?? false // Use nullish coalescing for boolean default
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const job = result[0];
    return {
      ...job,
      salary_min: job.salary_min ? parseFloat(job.salary_min) : null, // Convert string back to number or null
      salary_max: job.salary_max ? parseFloat(job.salary_max) : null // Convert string back to number or null
    };
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};