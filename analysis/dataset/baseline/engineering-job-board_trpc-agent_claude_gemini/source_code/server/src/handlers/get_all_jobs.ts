import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type JobListing } from '../schema';
import { desc } from 'drizzle-orm';

export async function getAllJobs(): Promise<JobListing[]> {
  try {
    // Fetch all job listings ordered by creation date (newest first)
    const results = await db.select()
      .from(jobListingsTable)
      .orderBy(desc(jobListingsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all jobs:', error);
    throw error;
  }
}
