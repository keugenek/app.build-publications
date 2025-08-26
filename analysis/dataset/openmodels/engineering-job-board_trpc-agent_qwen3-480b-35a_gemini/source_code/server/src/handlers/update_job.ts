import { db } from '../db';
import { jobsTable } from '../db/schema';
import { type UpdateJobInput, type Job } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJob = async (input: UpdateJobInput): Promise<Job> => {
  try {
    // Prepare update data, excluding the id
    const updateData: any = {
      updated_at: new Date()
    };

    // Only add fields to updateData if they are provided in the input
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.discipline !== undefined) updateData.discipline = input.discipline;
    if (input.salary_min !== undefined) {
      updateData.salary_min = input.salary_min === null ? null : input.salary_min.toString();
    }
    if (input.salary_max !== undefined) {
      updateData.salary_max = input.salary_max === null ? null : input.salary_max.toString();
    }
    if (input.is_remote !== undefined) updateData.is_remote = input.is_remote;

    // Update job record
    const result = await db.update(jobsTable)
      .set(updateData)
      .where(eq(jobsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Job with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const job = result[0];
    return {
      ...job,
      salary_min: job.salary_min !== null ? parseFloat(job.salary_min) : null,
      salary_max: job.salary_max !== null ? parseFloat(job.salary_max) : null
    };
  } catch (error) {
    console.error('Job update failed:', error);
    throw error;
  }
};