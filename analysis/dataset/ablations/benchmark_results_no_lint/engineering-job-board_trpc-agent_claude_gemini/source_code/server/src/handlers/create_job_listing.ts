import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type JobListing } from '../schema';

export const createJobListing = async (input: CreateJobListingInput): Promise<JobListing> => {
  try {
    // Insert job listing record
    const result = await db.insert(jobListingsTable)
      .values({
        title: input.title,
        company_name: input.company_name,
        location: input.location,
        description: input.description,
        engineering_discipline: input.engineering_discipline
      })
      .returning()
      .execute();

    // Return the created job listing
    const jobListing = result[0];
    return jobListing;
  } catch (error) {
    console.error('Job listing creation failed:', error);
    throw error;
  }
};
