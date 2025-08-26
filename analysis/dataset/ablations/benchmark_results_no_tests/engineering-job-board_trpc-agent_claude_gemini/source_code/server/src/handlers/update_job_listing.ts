import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type UpdateJobListingInput, type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobListing = async (input: UpdateJobListingInput): Promise<JobListing | null> => {
  try {
    // Check if job listing exists
    const existingListing = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, input.id))
      .execute();

    if (existingListing.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof jobListingsTable.$inferInsert> = {
      updated_at: new Date(), // Always update the timestamp
    };

    // Only include fields that are provided in the input
    if (input.job_title !== undefined) {
      updateData.job_title = input.job_title;
    }
    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }
    if (input.engineering_discipline !== undefined) {
      updateData.engineering_discipline = input.engineering_discipline;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.job_description !== undefined) {
      updateData.job_description = input.job_description;
    }
    if (input.application_link !== undefined) {
      updateData.application_link = input.application_link;
    }

    // Update the job listing
    const result = await db.update(jobListingsTable)
      .set(updateData)
      .where(eq(jobListingsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Job listing update failed:', error);
    throw error;
  }
};
