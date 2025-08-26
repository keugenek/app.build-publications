import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type CreateJobListingInput, type JobListing } from '../schema';

export const createJobListing = async (input: CreateJobListingInput): Promise<JobListing> => {
  try {
    // Insert job listing record
    const result = await db.insert(jobListingsTable)
      .values({
        job_title: input.job_title,
        company_name: input.company_name,
        engineering_discipline: input.engineering_discipline,
        location: input.location,
        job_description: input.job_description,
        application_link: input.application_link
        // created_at and updated_at will be set automatically by the database defaults
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
