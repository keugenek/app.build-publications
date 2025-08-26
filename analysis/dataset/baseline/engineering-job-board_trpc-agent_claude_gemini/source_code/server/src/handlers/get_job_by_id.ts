import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type GetJobByIdInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobById = async (input: GetJobByIdInput): Promise<JobListing | null> => {
  try {
    // Query the database for the specific job listing by ID
    const results = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, input.id))
      .execute();

    // Return the job listing if found, null if not found
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to fetch job listing:', error);
    throw error;
  }
};
