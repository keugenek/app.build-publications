import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type UpdateJobListingInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobListing = async (input: UpdateJobListingInput): Promise<JobListing | null> => {
  try {
    const { id, ...updateData } = input;

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      // If no fields to update, just return the existing record
      const existingRecord = await db.select()
        .from(jobListingsTable)
        .where(eq(jobListingsTable.id, id))
        .execute();
      
      return existingRecord.length > 0 ? existingRecord[0] : null;
    }

    // Update the record with provided fields and updated_at timestamp
    const result = await db.update(jobListingsTable)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(jobListingsTable.id, id))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Job listing update failed:', error);
    throw error;
  }
};
