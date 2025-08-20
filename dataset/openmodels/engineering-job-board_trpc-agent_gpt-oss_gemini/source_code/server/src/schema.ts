import { z } from 'zod';

// Engineering discipline enum (nerd style)
export const disciplineEnum = z.enum([
  'Software',
  'Mechanical',
  'Electrical',
  'Civil',
  'Aerospace',
]);
export type Discipline = z.infer<typeof disciplineEnum>;

// Output schema for a job listing
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Can be explicitly null
  discipline: disciplineEnum,
  location: z.string(),
  salary: z.number().optional(), // Optional numeric field (may be undefined)
  posted_at: z.coerce.date(), // Timestamp converted to Date
});
export type Job = z.infer<typeof jobSchema>;

// Input schema for creating a job listing
export const createJobInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(), // Allow explicit null, not undefined
  discipline: disciplineEnum,
  location: z.string(),
  salary: z.number().positive().optional(), // Positive salary if provided
});
export type CreateJobInput = z.infer<typeof createJobInputSchema>;

// Input schema for updating a job listing (partial)
export const updateJobInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  discipline: disciplineEnum.optional(),
  location: z.string().optional(),
  salary: z.number().positive().optional(),
});
export type UpdateJobInput = z.infer<typeof updateJobInputSchema>;

// Input schema for searching / filtering jobs
export const searchJobsInputSchema = z.object({
  discipline: disciplineEnum.optional(),
  location: z.string().optional(),
});
export type SearchJobsInput = z.infer<typeof searchJobsInputSchema>;
