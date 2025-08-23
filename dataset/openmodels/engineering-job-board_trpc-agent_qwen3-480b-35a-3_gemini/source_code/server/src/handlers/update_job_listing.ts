import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type UpdateJobListingInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobListing = async (input: UpdateJobListingInput): Promise<JobListing | null> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.discipline !== undefined) {
      updateData.discipline = input.discipline;
    }
    
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    
    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();
    
    // Update the job listing
    const result = await db.update(jobListingsTable)
      .set(updateData)
      .where(eq(jobListingsTable.id, input.id))
      .returning()
      .execute();
    
    // Return null if no rows were updated
    if (result.length === 0) {
      return null;
    }
    
    // Return the updated job listing
    return result[0];
  } catch (error) {
    console.error('Job listing update failed:', error);
    throw error;
  }
};
