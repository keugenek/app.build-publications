import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteJobListing = async (id: number): Promise<boolean> => {
  try {
    // Delete job listing by ID
    const result = await db.delete(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .returning()
      .execute();
    
    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete job listing:', error);
    throw error;
  }
};
