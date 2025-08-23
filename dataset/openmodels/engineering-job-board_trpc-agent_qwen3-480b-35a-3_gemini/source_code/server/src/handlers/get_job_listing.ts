import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type JobListing } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobListing = async (id: number): Promise<JobListing | null> => {
  try {
    const result = await db.select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const jobListing = result[0];
    return {
      ...jobListing,
      created_at: new Date(jobListing.created_at),
      updated_at: new Date(jobListing.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch job listing:', error);
    throw error;
  }
};
