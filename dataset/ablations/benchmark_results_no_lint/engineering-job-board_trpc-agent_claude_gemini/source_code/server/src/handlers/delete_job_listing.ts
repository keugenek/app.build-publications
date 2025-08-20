import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteJobListing = async (id: number): Promise<boolean> => {
  try {
    // Delete the job listing by ID
    const result = await db.delete(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .returning({ id: jobListingsTable.id })
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Job listing deletion failed:', error);
    throw error;
  }
};
