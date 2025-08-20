import { z } from 'zod';

// Engineering discipline enum
export const engineeringDisciplines = [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial',
  'Other'
] as const;

export const engineeringDisciplineSchema = z.enum(engineeringDisciplines);
export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineSchema>;

// Job listing schema for database records
export const jobListingSchema = z.object({
  id: z.number(),
  job_title: z.string(),
  company_name: z.string(),
  engineering_discipline: engineeringDisciplineSchema,
  location: z.string(),
  job_description: z.string(),
  application_link: z.string().url(), // URL or email validation
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobListing = z.infer<typeof jobListingSchema>;

// Input schema for creating job listings
export const createJobListingInputSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  company_name: z.string().min(1, "Company name is required"),
  engineering_discipline: engineeringDisciplineSchema,
  location: z.string().min(1, "Location is required"),
  job_description: z.string().min(1, "Job description is required"),
  application_link: z.string().url("Must be a valid URL or email address")
});

export type CreateJobListingInput = z.infer<typeof createJobListingInputSchema>;

// Input schema for updating job listings
export const updateJobListingInputSchema = z.object({
  id: z.number(),
  job_title: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().min(1).optional(),
  job_description: z.string().min(1).optional(),
  application_link: z.string().url().optional()
});

export type UpdateJobListingInput = z.infer<typeof updateJobListingInputSchema>;

// Input schema for filtering job listings
export const jobListingFiltersSchema = z.object({
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().optional() // Partial match on location
});

export type JobListingFilters = z.infer<typeof jobListingFiltersSchema>;

// Input schema for getting a single job listing
export const getJobListingInputSchema = z.object({
  id: z.number()
});

export type GetJobListingInput = z.infer<typeof getJobListingInputSchema>;

// Input schema for deleting a job listing
export const deleteJobListingInputSchema = z.object({
  id: z.number()
});

export type DeleteJobListingInput = z.infer<typeof deleteJobListingInputSchema>;
