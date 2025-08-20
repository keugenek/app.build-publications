// Zod schemas and TypeScript types for the personal well-being dashboard
import { z } from 'zod';

// DailyLog output schema (matches DB representation)
export const dailyLogSchema = z.object({
  id: z.number(),
  // Timestamp of the log entry; coerced from string/number to Date
  logged_at: z.coerce.date(),
  sleep_hours: z.number().nonnegative(), // Hours of sleep (e.g., 7.5)
  work_hours: z.number().nonnegative(), // Hours spent working
  social_hours: z.number().nonnegative(), // Hours spent socially
  screen_hours: z.number().nonnegative(), // Hours of screen time
  emotional_energy: z.number().int().min(1).max(10) // Scale 1-10
});

export type DailyLog = z.infer<typeof dailyLogSchema>;

// Input schema for creating a daily log
export const createDailyLogInputSchema = z.object({
  logged_at: z.coerce.date(),
  sleep_hours: z.number().nonnegative(),
  work_hours: z.number().nonnegative(),
  social_hours: z.number().nonnegative(),
  screen_hours: z.number().nonnegative(),
  emotional_energy: z.number().int().min(1).max(10)
});

export type CreateDailyLogInput = z.infer<typeof createDailyLogInputSchema>;

// Input schema for updating a daily log (partial fields allowed)
export const updateDailyLogInputSchema = z.object({
  id: z.number(),
  logged_at: z.coerce.date().optional(),
  sleep_hours: z.number().nonnegative().optional(),
  work_hours: z.number().nonnegative().optional(),
  social_hours: z.number().nonnegative().optional(),
  screen_hours: z.number().nonnegative().optional(),
  emotional_energy: z.number().int().min(1).max(10).optional()
});

export type UpdateDailyLogInput = z.infer<typeof updateDailyLogInputSchema>;
