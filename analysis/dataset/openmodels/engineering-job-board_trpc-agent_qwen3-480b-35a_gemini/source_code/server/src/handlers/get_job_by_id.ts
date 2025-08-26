import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type Job } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobById = async (id: number): Promise<Job | null> => {
  try {
    const result = await db.select()
      .from(jobsTable)
      .where(eq(jobsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const job = result[0];
    
    // Convert numeric fields back to numbers before returning
    return {
      ...job,
      salary_min: job.salary_min !== null ? parseFloat(job.salary_min) : null,
      salary_max: job.salary_max !== null ? parseFloat(job.salary_max) : null
    } as Job;
  } catch (error) {
    console.error('Failed to fetch job by ID:', error);
    throw error;
  }
};