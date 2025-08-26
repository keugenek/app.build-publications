import { type CreateJobInput, type Job } from '../schema';

/**
 * Placeholder handler for creating a job posting.
 * In a real implementation this would insert the job into the database
 * and return the newly created record.
 */
export const createJob = async (input: CreateJobInput): Promise<Job> => {
  // TODO: Insert into DB using drizzle
  return {
    id: 0, // placeholder ID
    title: input.title,
    company_name: input.company_name,
    description: input.description ?? null,
    disciplines: input.disciplines,
    location: input.location,
    salary_min: input.salary_min ?? null,
    salary_max: input.salary_max ?? null,
    experience_years: input.experience_years,
    application_url: input.application_url,
    created_at: new Date(),
  } as Job;
};
