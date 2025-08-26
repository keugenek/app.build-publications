import { z } from 'zod';

// Engineering disciplines enum
export const engineeringDisciplineSchema = z.enum([
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Industrial',
  'Environmental',
  'Materials',
  'Nuclear',
  'Other'
]);

export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineSchema>;

// Job listing schema
export const jobListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  engineering_discipline: engineeringDisciplineSchema,
  location: z.string(),
  company_name: z.string(),
  application_url: z.string().url(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobListing = z.infer<typeof jobListingSchema>;

// Input schema for creating job listings
export const createJobListingInputSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Job description is required'),
  engineering_discipline: engineeringDisciplineSchema,
  location: z.string().min(1, 'Location is required'),
  company_name: z.string().min(1, 'Company name is required'),
  application_url: z.string().url('Must be a valid URL')
});

export type CreateJobListingInput = z.infer<typeof createJobListingInputSchema>;

// Input schema for updating job listings
export const updateJobListingInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  application_url: z.string().url().optional()
});

export type UpdateJobListingInput = z.infer<typeof updateJobListingInputSchema>;

// Search and filter input schema
export const searchJobsInputSchema = z.object({
  keyword: z.string().optional(), // Search in title and description
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().optional(), // Filter by location
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export type SearchJobsInput = z.infer<typeof searchJobsInputSchema>;

// Get job by ID input schema
export const getJobByIdInputSchema = z.object({
  id: z.number()
});

export type GetJobByIdInput = z.infer<typeof getJobByIdInputSchema>;

// Delete job input schema
export const deleteJobInputSchema = z.object({
  id: z.number()
});

export type DeleteJobInput = z.infer<typeof deleteJobInputSchema>;
