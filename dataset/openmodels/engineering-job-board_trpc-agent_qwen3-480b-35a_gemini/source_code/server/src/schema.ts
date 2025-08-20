import { z } from 'zod';

// Define the discipline enum values
export const DISCIPLINES = [
  'Software Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Data Science',
  'DevOps',
  'QA Engineering',
  'Security Engineering',
  'Systems Engineering',
  'Embedded Systems',
  'AI/ML Engineering',
  'Product Engineering',
  'Other'
] as const;

export type Discipline = typeof DISCIPLINES[number];

// Job schema with proper numeric handling
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  company: z.string(),
  location: z.string(),
  discipline: z.enum(DISCIPLINES),
  salary_min: z.number().nullable(), // Stored as numeric in DB, but we use number in TS, can be null
  salary_max: z.number().nullable(), // Stored as numeric in DB, but we use number in TS, can be null
  is_remote: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()  // Automatically converts string timestamps to Date objects
});

export type Job = z.infer<typeof jobSchema>;

// Input schema for creating jobs
export const createJobInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  discipline: z.enum(DISCIPLINES),
  salary_min: z.number().positive().optional(), // Optional field, not required
  salary_max: z.number().positive().optional(), // Optional field, not required
  is_remote: z.boolean().optional().default(false)
});

export type CreateJobInput = z.infer<typeof createJobInputSchema>;

// Input schema for updating jobs
export const updateJobInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  company: z.string().min(1, "Company is required").optional(),
  location: z.string().min(1, "Location is required").optional(),
  discipline: z.enum(DISCIPLINES).optional(),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  is_remote: z.boolean().optional()
});

export type UpdateJobInput = z.infer<typeof updateJobInputSchema>;

// Schema for job filtering
export const jobFilterSchema = z.object({
  discipline: z.enum(DISCIPLINES).optional(),
  location: z.string().optional(),
  is_remote: z.boolean().optional(),
  search: z.string().optional()
});

export type JobFilter = z.infer<typeof jobFilterSchema>;