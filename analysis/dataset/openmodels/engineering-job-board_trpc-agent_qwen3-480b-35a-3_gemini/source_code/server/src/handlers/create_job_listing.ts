import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type JobListing } from '../schema';

export const createJobListing = async (input: CreateJobListingInput): Promise<JobListing> => {
  try {
    // Insert job listing record
    const result = await db.insert(jobListingsTable)
      .values({
        title: input.title,
        description: input.description,
        discipline: input.discipline,
        location: input.location,
        company_name: input.company_name
      })
      .returning()
      .execute();

    // Return the created job listing
    return result[0];
  } catch (error) {
    console.error('Job listing creation failed:', error);
    throw error;
  }
};
