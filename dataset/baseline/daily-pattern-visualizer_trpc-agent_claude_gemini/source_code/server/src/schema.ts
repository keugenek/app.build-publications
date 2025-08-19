import { z } from 'zod';

// Daily log schema
export const dailyLogSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  sleep_duration: z.number().min(0).max(24), // Hours of sleep (0-24)
  work_hours: z.number().min(0).max(24), // Hours of work (0-24)
  social_time: z.number().min(0).max(24), // Hours of social time (0-24)
  screen_time: z.number().min(0).max(24), // Hours of screen time (0-24)
  emotional_energy: z.number().int().min(1).max(10), // Scale 1-10
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyLog = z.infer<typeof dailyLogSchema>;

// Input schema for creating daily logs
export const createDailyLogInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  sleep_duration: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_time: z.number().min(0).max(24),
  screen_time: z.number().min(0).max(24),
  emotional_energy: z.number().int().min(1).max(10)
});

export type CreateDailyLogInput = z.infer<typeof createDailyLogInputSchema>;

// Input schema for updating daily logs
export const updateDailyLogInputSchema = z.object({
  id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  sleep_duration: z.number().min(0).max(24).optional(),
  work_hours: z.number().min(0).max(24).optional(),
  social_time: z.number().min(0).max(24).optional(),
  screen_time: z.number().min(0).max(24).optional(),
  emotional_energy: z.number().int().min(1).max(10).optional()
});

export type UpdateDailyLogInput = z.infer<typeof updateDailyLogInputSchema>;

// Query schema for getting logs by date range
export const getLogsByDateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type GetLogsByDateRangeInput = z.infer<typeof getLogsByDateRangeSchema>;

// Query schema for getting log by specific date
export const getLogByDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type GetLogByDateInput = z.infer<typeof getLogByDateSchema>;

// Break suggestion schema
export const breakSuggestionSchema = z.object({
  work_hours: z.number(),
  screen_time: z.number(),
  suggestions: z.array(z.string())
});

export type BreakSuggestion = z.infer<typeof breakSuggestionSchema>;

// Weekly trends schema for charts
export const weeklyTrendsSchema = z.object({
  dates: z.array(z.string()),
  sleep_duration: z.array(z.number()),
  work_hours: z.array(z.number()),
  social_time: z.array(z.number()),
  screen_time: z.array(z.number()),
  emotional_energy: z.array(z.number())
});

export type WeeklyTrends = z.infer<typeof weeklyTrendsSchema>;
