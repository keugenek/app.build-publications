import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type JobListing } from '../schema';

export const getJobListingById = async (id: number): Promise<JobListing | null> => {
  try {
    // Query the job listing by ID
    const results = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .execute();

    // Return the job listing if found, null otherwise
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) result
    return results[0];
  } catch (error) {
    console.error('Failed to fetch job listing by ID:', error);
    throw error;
  }
};
