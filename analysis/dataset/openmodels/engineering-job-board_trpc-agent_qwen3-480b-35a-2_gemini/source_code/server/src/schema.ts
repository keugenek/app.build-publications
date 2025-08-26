import { z } from 'zod';

// Define the engineering disciplines enum
export const engineeringDisciplines = [
  'Software Engineering',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cybersecurity',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'Cloud Engineering',
  'Database Engineering',
  'Systems Engineering',
  'Network Engineering',
  'Embedded Systems',
  'QA Engineering',
  'Product Engineering',
  'UI/UX Engineering',
  'Other'
] as const;

export type EngineeringDiscipline = typeof engineeringDisciplines[number];

// Define location enum for common locations
export const locations = [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Los Angeles, CA',
  'Chicago, IL',
  'Boston, MA',
  'Denver, CO',
  'Atlanta, GA',
  'Other'
] as const;

export type Location = typeof locations[number];

// Job schema with proper numeric handling
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  discipline: z.enum(engineeringDisciplines),
  location: z.enum(locations),
  company_name: z.string(),
  application_link: z.string().url(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Job = z.infer<typeof jobSchema>;

// Input schema for creating jobs
export const createJobInputSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required"),
  discipline: z.enum(engineeringDisciplines),
  location: z.enum(locations),
  company_name: z.string().min(1, "Company name is required"),
  application_link: z.string().url("Invalid URL format")
});

export type CreateJobInput = z.infer<typeof createJobInputSchema>;

// Input schema for filtering jobs
export const filterJobsInputSchema = z.object({
  discipline: z.enum(engineeringDisciplines).optional(),
  location: z.enum(locations).optional()
});

export type FilterJobsInput = z.infer<typeof filterJobsInputSchema>;
