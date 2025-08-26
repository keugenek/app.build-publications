import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export async function getJobListingById(id: number): Promise<JobListing | null> {
  try {
    const results = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const jobListing = results[0];
    
    return {
      ...jobListing,
      id: jobListing.id,
      title: jobListing.title,
      company_name: jobListing.company_name,
      location: jobListing.location,
      engineering_discipline: jobListing.engineering_discipline,
      description: jobListing.description,
      requirements: jobListing.requirements,
      salary_range: jobListing.salary_range,
      employment_type: jobListing.employment_type,
      remote_friendly: jobListing.remote_friendly,
      created_at: jobListing.created_at,
      updated_at: jobListing.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch job listing by ID:', error);
    throw error;
  }
}
