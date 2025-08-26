import { z } from 'zod';

// Define allowed engineering disciplines
export const engineeringDisciplines = [
  'Software Engineering',
  'Data Engineering',
  'DevOps Engineering',
  'Machine Learning Engineering',
  'Security Engineering',
  'Frontend Engineering',
  'Backend Engineering',
  'Full Stack Engineering',
  'Embedded Systems Engineering',
  'Cloud Engineering',
  'Infrastructure Engineering',
  'Quality Assurance Engineering',
  'Site Reliability Engineering',
  'Systems Engineering',
  'Mobile Engineering',
  'Game Development',
  'Blockchain Engineering',
  'AI Engineering',
] as const;

export type EngineeringDiscipline = typeof engineeringDisciplines[number];

// Job listing schema
export const jobListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  discipline: z.enum(engineeringDisciplines),
  location: z.string(),
  company_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type JobListing = z.infer<typeof jobListingSchema>;

// Input schema for creating job listings
export const createJobListingInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  discipline: z.enum(engineeringDisciplines),
  location: z.string().min(1, "Location is required"),
  company_name: z.string().min(1, "Company name is required"),
});

export type CreateJobListingInput = z.infer<typeof createJobListingInputSchema>;

// Input schema for updating job listings
export const updateJobListingInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  discipline: z.enum(engineeringDisciplines).optional(),
  location: z.string().min(1, "Location is required").optional(),
  company_name: z.string().min(1, "Company name is required").optional(),
});

export type UpdateJobListingInput = z.infer<typeof updateJobListingInputSchema>;

// Input schema for filtering job listings
export const filterJobListingsInputSchema = z.object({
  discipline: z.enum(engineeringDisciplines).optional(),
  location: z.string().optional(),
});

export type FilterJobListingsInput = z.infer<typeof filterJobListingsInputSchema>;
