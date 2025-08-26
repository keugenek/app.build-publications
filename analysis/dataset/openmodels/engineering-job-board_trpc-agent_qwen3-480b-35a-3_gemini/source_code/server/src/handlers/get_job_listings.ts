import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { eq, and, type SQL } from 'drizzle-orm';
import { type JobListing, type FilterJobListingsInput, type EngineeringDiscipline } from '../schema';

export const getJobListings = async (filters?: FilterJobListingsInput): Promise<JobListing[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filters?.discipline) {
      conditions.push(eq(jobListingsTable.discipline, filters.discipline));
    }

    if (filters?.location) {
      conditions.push(eq(jobListingsTable.location, filters.location));
    }

    // Execute query with or without filters
    let results;
    if (conditions.length > 0) {
      results = await db.select()
        .from(jobListingsTable)
        .where(and(...conditions))
        .execute();
    } else {
      results = await db.select()
        .from(jobListingsTable)
        .execute();
    }

    // Map results to proper types
    return results.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      discipline: job.discipline as EngineeringDiscipline,
      location: job.location,
      company_name: job.company_name,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at),
    }));
  } catch (error) {
    console.error('Failed to fetch job listings:', error);
    throw error;
  }
};
