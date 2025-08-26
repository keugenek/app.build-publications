import { z } from 'zod';

// Daily metrics schema
export const dailyMetricsSchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Stored as date in DB, but we use Date in TS
  sleep_duration: z.number(), // Hours of sleep
  work_hours: z.number(), // Work hours
  social_time: z.number(), // Social time in hours
  screen_time: z.number(), // Screen time in hours
  emotional_energy: z.number().int().min(1).max(10), // Energy level 1-10
  created_at: z.coerce.date()
});

export type DailyMetrics = z.infer<typeof dailyMetricsSchema>;

// Input schema for creating daily metrics
export const createDailyMetricsInputSchema = z.object({
  date: z.coerce.date(),
  sleep_duration: z.number().nonnegative(),
  work_hours: z.number().nonnegative(),
  social_time: z.number().nonnegative(),
  screen_time: z.number().nonnegative(),
  emotional_energy: z.number().int().min(1).max(10)
});

export type CreateDailyMetricsInput = z.infer<typeof createDailyMetricsInputSchema>;

// Input schema for updating daily metrics
export const updateDailyMetricsInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  sleep_duration: z.number().nonnegative().optional(),
  work_hours: z.number().nonnegative().optional(),
  social_time: z.number().nonnegative().optional(),
  screen_time: z.number().nonnegative().optional(),
  emotional_energy: z.number().int().min(1).max(10).optional()
});

export type UpdateDailyMetricsInput = z.infer<typeof updateDailyMetricsInputSchema>;
