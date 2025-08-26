import { z } from 'zod';

// Engineering discipline enum
export const engineeringDisciplineEnum = z.enum([
  'Software',
  'Mechanical',
  'Electrical',
  'Civil',
  'Chemical',
  'Aerospace',
]);
export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineEnum>;

// Job output schema (matches DB representation)
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  company_name: z.string(),
  description: z.string().nullable(), // Nullable field, can be explicitly null
  disciplines: z.array(engineeringDisciplineEnum), // Multi-select
  location: z.string(),
  salary_min: z.number().int().nonnegative().nullable(), // Nullable salary range
  salary_max: z.number().int().nonnegative().nullable(),
  experience_years: z.number().int().nonnegative(),
  application_url: z.string().url(),
  created_at: z.coerce.date(),
});

export type Job = z.infer<typeof jobSchema>;

// Input schema for creating a job posting
export const createJobInputSchema = z.object({
  title: z.string(),
  company_name: z.string(),
  description: z.string().nullable(),
  disciplines: z.array(engineeringDisciplineEnum).min(1),
  location: z.string(),
  salary_min: z.number().int().nonnegative().nullable().optional(),
  salary_max: z.number().int().nonnegative().nullable().optional(),
  experience_years: z.number().int().nonnegative(),
  application_url: z.string().url(),
});

export type CreateJobInput = z.infer<typeof createJobInputSchema>;

// Input schema for updating a job posting
export const updateJobInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  company_name: z.string().optional(),
  description: z.string().nullable().optional(),
  disciplines: z.array(engineeringDisciplineEnum).optional(),
  location: z.string().optional(),
  salary_min: z.number().int().nonnegative().nullable().optional(),
  salary_max: z.number().int().nonnegative().nullable().optional(),
  experience_years: z.number().int().nonnegative().optional(),
  application_url: z.string().url().optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobInputSchema>;

// Input schema for filtering jobs (used in getJobs query)
export const getJobsFilterSchema = z.object({
  discipline: engineeringDisciplineEnum.optional(), // filter by a single discipline
  location: z.string().optional(),
});

export type GetJobsFilter = z.infer<typeof getJobsFilterSchema>;
