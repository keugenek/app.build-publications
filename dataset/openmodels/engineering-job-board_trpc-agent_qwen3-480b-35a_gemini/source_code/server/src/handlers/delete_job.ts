import { db } from '../db';
import { jobsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteJob = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(jobsTable)
      .where(eq(jobsTable.id, id))
      .returning()
      .execute();

    // If no rows were deleted, return false
    return result.length > 0;
  } catch (error) {
    console.error('Job deletion failed:', error);
    throw error;
  }
};