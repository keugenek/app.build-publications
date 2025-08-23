import { z } from 'zod';

// Enum for engineering disciplines
export const engineeringDisciplineEnum = z.enum([
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
]);
export type EngineeringDiscipline = z.infer<typeof engineeringDisciplineEnum>;

// Job output schema (full representation including DB generated fields)
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  discipline: engineeringDisciplineEnum,
  description: z.string(),
  application_contact: z.string(),
  created_at: z.coerce.date(),
});
export type Job = z.infer<typeof jobSchema>;

// Input schema for creating a job (no id or timestamps)
export const createJobInputSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  discipline: engineeringDisciplineEnum,
  description: z.string(),
  application_contact: z.string(),
});
export type CreateJobInput = z.infer<typeof createJobInputSchema>;

// Input schema for querying jobs with optional filters
export const getJobsInputSchema = z.object({
  discipline: engineeringDisciplineEnum.optional().nullable(),
  location: z.string().optional(),
});
export type GetJobsInput = z.infer<typeof getJobsInputSchema>;
