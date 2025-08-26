import { type Job } from '../schema';
import { db } from '../db';
import { jobsTable } from '../db/schema';

/**
 * Placeholder handler to fetch all job listings.
 */
export const getJobs = async (): Promise<Job[]> => {
  const rows = await db.select().from(jobsTable).execute();
  // Map rows to Job type, handling numeric conversion for salary
  return rows.map(row => {
    const salary = row.salary !== null && row.salary !== undefined ? parseFloat(row.salary as unknown as string) : undefined;
    return {
      ...row,
      salary,
    } as Job;
  });
  return [];
};
