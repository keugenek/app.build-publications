import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type UpdateJobListingInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobListing = async (input: UpdateJobListingInput): Promise<JobListing | null> => {
  try {
    // Extract ID and other fields
    const { id, ...updateFields } = input;

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      // If no fields to update, just return the existing record
      const existing = await db.select()
        .from(jobListingsTable)
        .where(eq(jobListingsTable.id, id))
        .execute();

      return existing.length > 0 ? existing[0] : null;
    }

    // Update the job listing with the provided fields and updated_at timestamp
    const result = await db.update(jobListingsTable)
      .set({
        ...updateFields,
        updated_at: new Date() // Always update the timestamp
      })
      .where(eq(jobListingsTable.id, id))
      .returning()
      .execute();

    // Return the updated record if found, null otherwise
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Job listing update failed:', error);
    throw error;
  }
};
