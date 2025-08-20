import { z } from 'zod';

// Daily metrics schema
export const dailyMetricsSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  sleep_duration: z.number().min(0).max(24), // Hours of sleep (0-24)
  work_hours: z.number().min(0).max(24), // Hours worked (0-24)
  social_interaction_time: z.number().min(0).max(24), // Hours of social interaction (0-24)
  screen_time: z.number().min(0).max(24), // Hours of screen time (0-24)
  emotional_energy_level: z.number().int().min(1).max(10), // Energy level scale 1-10
  notes: z.string().nullable(), // Optional daily notes
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyMetrics = z.infer<typeof dailyMetricsSchema>;

// Work session schema for break tracking
export const workSessionSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date().nullable(), // Null if session is ongoing
  is_break: z.boolean(), // True if this is a break session
  created_at: z.coerce.date()
});

export type WorkSession = z.infer<typeof workSessionSchema>;

// Input schema for creating daily metrics
export const createDailyMetricsInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  sleep_duration: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_interaction_time: z.number().min(0).max(24),
  screen_time: z.number().min(0).max(24),
  emotional_energy_level: z.number().int().min(1).max(10),
  notes: z.string().nullable().optional()
});

export type CreateDailyMetricsInput = z.infer<typeof createDailyMetricsInputSchema>;

// Input schema for updating daily metrics
export const updateDailyMetricsInputSchema = z.object({
  id: z.number(),
  sleep_duration: z.number().min(0).max(24).optional(),
  work_hours: z.number().min(0).max(24).optional(),
  social_interaction_time: z.number().min(0).max(24).optional(),
  screen_time: z.number().min(0).max(24).optional(),
  emotional_energy_level: z.number().int().min(1).max(10).optional(),
  notes: z.string().nullable().optional()
});

export type UpdateDailyMetricsInput = z.infer<typeof updateDailyMetricsInputSchema>;

// Input schema for starting a work session
export const startWorkSessionInputSchema = z.object({
  is_break: z.boolean().default(false)
});

export type StartWorkSessionInput = z.infer<typeof startWorkSessionInputSchema>;

// Input schema for ending a work session
export const endWorkSessionInputSchema = z.object({
  id: z.number()
});

export type EndWorkSessionInput = z.infer<typeof endWorkSessionInputSchema>;

// Query schema for getting metrics by date range
export const getMetricsByDateRangeInputSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type GetMetricsByDateRangeInput = z.infer<typeof getMetricsByDateRangeInputSchema>;

// Query schema for getting metrics by single date
export const getMetricsByDateInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type GetMetricsByDateInput = z.infer<typeof getMetricsByDateInputSchema>;

// Break alert response schema
export const breakAlertSchema = z.object({
  should_take_break: z.boolean(),
  continuous_work_hours: z.number(),
  last_break_time: z.coerce.date().nullable(),
  message: z.string()
});

export type BreakAlert = z.infer<typeof breakAlertSchema>;
