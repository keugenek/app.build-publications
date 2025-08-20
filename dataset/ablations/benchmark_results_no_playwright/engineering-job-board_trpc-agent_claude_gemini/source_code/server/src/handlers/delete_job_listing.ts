import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteJobListing = async (id: number): Promise<boolean> => {
  try {
    // Delete the job listing with the given ID
    const result = await db.delete(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    // result.rowCount will be 1 if a row was deleted, 0 if no matching row found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Job listing deletion failed:', error);
    throw error;
  }
};
