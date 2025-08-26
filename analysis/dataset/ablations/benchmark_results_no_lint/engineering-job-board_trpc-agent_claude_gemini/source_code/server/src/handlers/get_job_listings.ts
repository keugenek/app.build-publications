import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type JobListing } from '../schema';
import { desc } from 'drizzle-orm';

export const getJobListings = async (): Promise<JobListing[]> => {
  try {
    // Get all job listings ordered by creation date (most recent first)
    const results = await db.select()
      .from(jobListingsTable)
      .orderBy(desc(jobListingsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch job listings:', error);
    throw error;
  }
};
