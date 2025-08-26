import { db } from '../db';
import { jobsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateJobInput, type Job } from '../schema';

/**
 * Update a job listing in the database.
 * Only fields provided in the input are updated; others remain unchanged.
 * Numeric fields are stored as strings in the DB (numeric column) and
 * converted back to numbers when returning.
 */
export const updateJob = async (input: UpdateJobInput): Promise<Job> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<import('../db/schema').NewJob> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description ?? null;
    if (input.discipline !== undefined) updateData.discipline = input.discipline as any;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.salary !== undefined) updateData.salary = input.salary.toString();

    const result = await db
      .update(jobsTable)
      .set(updateData)
      .where(eq(jobsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Job with id ${input.id} not found`);
    }

    const job = result[0];
    // Convert numeric fields back to numbers
    const salary = job.salary !== null && job.salary !== undefined ? parseFloat(job.salary) : undefined;
    return {
      ...job,
      salary,
    } as Job;
  } catch (error) {
    console.error('Job update failed:', error);
    throw error;
  }
};
