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
        engineering_discipline: input.engineering_discipline,
        description: input.description,
        requirements: input.requirements || null,
        salary_range: input.salary_range || null,
        employment_type: input.employment_type || 'Full-time',
        remote_friendly: input.remote_friendly || false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job listing creation failed:', error);
    throw error;
  }
};
