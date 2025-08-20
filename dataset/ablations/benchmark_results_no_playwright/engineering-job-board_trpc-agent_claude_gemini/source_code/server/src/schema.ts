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
  'Environmental',
  'Industrial',
  'Materials'
]);

export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineSchema>;

// Job listing schema
export const jobListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  company_name: z.string(),
  location: z.string(),
  engineering_discipline: engineeringDisciplineSchema,
  description: z.string(),
  requirements: z.string().nullable(), // Additional requirements, can be null
  salary_range: z.string().nullable(), // Salary information, can be null
  employment_type: z.string(), // Full-time, Part-time, Contract, etc.
  remote_friendly: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobListing = z.infer<typeof jobListingSchema>;

// Input schema for creating job listings
export const createJobListingInputSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company_name: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  engineering_discipline: engineeringDisciplineSchema,
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().nullable().optional(), // Can be null or omitted
  salary_range: z.string().nullable().optional(), // Can be null or omitted
  employment_type: z.string().default("Full-time"),
  remote_friendly: z.boolean().default(false)
});

export type CreateJobListingInput = z.infer<typeof createJobListingInputSchema>;

// Input schema for updating job listings
export const updateJobListingInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  engineering_discipline: engineeringDisciplineSchema.optional(),
  description: z.string().min(10).optional(),
  requirements: z.string().nullable().optional(),
  salary_range: z.string().nullable().optional(),
  employment_type: z.string().optional(),
  remote_friendly: z.boolean().optional()
});

export type UpdateJobListingInput = z.infer<typeof updateJobListingInputSchema>;

// Schema for filtering/searching job listings
export const jobListingFiltersSchema = z.object({
  engineering_discipline: engineeringDisciplineSchema.optional(),
  location: z.string().optional(), // Partial location match
  remote_friendly: z.boolean().optional(),
  employment_type: z.string().optional(),
  search_query: z.string().optional() // For searching in title, company, or description
});

export type JobListingFilters = z.infer<typeof jobListingFiltersSchema>;

// Schema for pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export type Pagination = z.infer<typeof paginationSchema>;

// Combined schema for getting job listings with filters and pagination
export const getJobListingsInputSchema = jobListingFiltersSchema.merge(paginationSchema);

export type GetJobListingsInput = z.infer<typeof getJobListingsInputSchema>;

// Response schema for paginated job listings
export const paginatedJobListingsSchema = z.object({
  data: z.array(jobListingSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export type PaginatedJobListings = z.infer<typeof paginatedJobListingsSchema>;
