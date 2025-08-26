import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type UpdateJobListingInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateJobListing(input: UpdateJobListingInput): Promise<JobListing | null> {
  try {
    // Destructure the id and the fields to update
    const { id, ...updateData } = input;

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Always update the updated_at timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date()
    };

    // Update the job listing and return the updated record
    const result = await db
      .update(jobListingsTable)
      .set(dataToUpdate)
      .where(eq(jobListingsTable.id, id))
      .returning()
      .execute();

    // If no record was updated (job listing not found), return null
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Job listing update failed:', error);
    throw error;
  }
}
