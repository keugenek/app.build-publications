import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteJobInput } from '../schema';

export const deleteJobListing = async (input: DeleteJobInput): Promise<boolean> => {
  try {
    // Delete the job listing by ID
    const result = await db.delete(jobListingsTable)
      .where(eq(jobListingsTable.id, input.id))
      .returning({ id: jobListingsTable.id })
      .execute();

    // Return true if a record was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Job listing deletion failed:', error);
    throw error;
  }
};
