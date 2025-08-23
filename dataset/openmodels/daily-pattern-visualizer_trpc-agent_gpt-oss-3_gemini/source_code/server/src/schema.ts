import { z } from 'zod';

// Log schema representing a daily wellbeing entry stored in the database
export const logSchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Accept string dates from client, coerce to Date
  sleep_duration: z.number().nonnegative(), // Hours, can be fractional
  work_hours: z.number().nonnegative(),
  social_time: z.number().nonnegative(),
  screen_time: z.number().nonnegative(),
  emotional_energy: z.number().int().min(1).max(10), // Scale 1-10
  created_at: z.coerce.date()
});

export type Log = z.infer<typeof logSchema>;

// Input schema for creating a new log entry
export const createLogInputSchema = z.object({
  date: z.coerce.date(),
  sleep_duration: z.number().nonnegative(),
  work_hours: z.number().nonnegative(),
  social_time: z.number().nonnegative(),
  screen_time: z.number().nonnegative(),
  emotional_energy: z.number().int().min(1).max(10)
});

export type CreateLogInput = z.infer<typeof createLogInputSchema>;

// Input schema for updating an existing log (optional fields)
export const updateLogInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  sleep_duration: z.number().nonnegative().optional(),
  work_hours: z.number().nonnegative().optional(),
  social_time: z.number().nonnegative().optional(),
  screen_time: z.number().nonnegative().optional(),
  emotional_energy: z.number().int().min(1).max(10).optional()
});

export type UpdateLogInput = z.infer<typeof updateLogInputSchema>;
