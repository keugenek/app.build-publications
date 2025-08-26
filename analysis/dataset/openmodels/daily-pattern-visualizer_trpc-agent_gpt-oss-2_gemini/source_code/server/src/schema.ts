import { z } from 'zod';

// Daily metrics schema representing a record of user activities for a specific date
export const dailyMetricsSchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Accepts string dates and coerces to Date
  sleep_duration: z.number().nonnegative(), // Hours of sleep, can be fractional
  work_hours: z.number().nonnegative(), // Hours spent working
  social_time: z.number().nonnegative(), // Hours spent socializing
  screen_time: z.number().nonnegative(), // Hours spent on screens
  emotional_energy: z.number().int().min(1).max(10) // Scale 1-10
});

export type DailyMetrics = z.infer<typeof dailyMetricsSchema>;

// Input schema for creating a new daily metrics entry (id and date are required, other fields are required)
export const createDailyMetricsInputSchema = z.object({
  date: z.coerce.date(),
  sleep_duration: z.number().nonnegative(),
  work_hours: z.number().nonnegative(),
  social_time: z.number().nonnegative(),
  screen_time: z.number().nonnegative(),
  emotional_energy: z.number().int().min(1).max(10)
});

export type CreateDailyMetricsInput = z.infer<typeof createDailyMetricsInputSchema>;

// Input schema for fetching metrics (optional date range)
export const getDailyMetricsInputSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export type GetDailyMetricsInput = z.infer<typeof getDailyMetricsInputSchema>;

// Input schema for suggestion generation (optional thresholds)
export const getSuggestionsInputSchema = z.object({
  workHoursThreshold: z.number().nonnegative().optional(),
  screenTimeThreshold: z.number().nonnegative().optional()
});

export type GetSuggestionsInput = z.infer<typeof getSuggestionsInputSchema>;
