import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteJobListingInput } from '../schema';

export const deleteJobListing = async (input: DeleteJobListingInput): Promise<{ success: boolean }> => {
  try {
    // Check if job listing exists first
    const existingJob = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, input.id))
      .execute();

    // If job listing doesn't exist, return success: false
    if (existingJob.length === 0) {
      return { success: false };
    }

    // Delete the job listing
    const result = await db.delete(jobListingsTable)
      .where(eq(jobListingsTable.id, input.id))
      .execute();

    // Return success based on whether any rows were affected
    return { success: true };
  } catch (error) {
    console.error('Job listing deletion failed:', error);
    throw error;
  }
};
