import { z } from 'zod';

// Engineering discipline enum
export const engineeringDisciplineSchema = z.enum([
  'Software',
  'Hardware',
  'Civil',
  'Mechanical',
  'Electrical',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial'
]);

export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineSchema>;

// Job listing schema
export const jobListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  company_name: z.string(),
  location: z.string(),
  description: z.string(),
  engineering_discipline: engineeringDisciplineSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobListing = z.infer<typeof jobListingSchema>;

// Input schema for creating job listings
export const createJobListingInputSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company_name: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Job description is required'),
  engineering_discipline: engineeringDisciplineSchema
});

export type CreateJobListingInput = z.infer<typeof createJobListingInputSchema>;

// Input schema for updating job listings
export const updateJobListingInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  engineering_discipline: engineeringDisciplineSchema.optional()
});

export type UpdateJobListingInput = z.infer<typeof updateJobListingInputSchema>;

// Search and filter schema
export const searchJobListingsInputSchema = z.object({
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().optional(),
  search_term: z.string().optional() // For searching in title, company, or description
});

export type SearchJobListingsInput = z.infer<typeof searchJobListingsInputSchema>;
