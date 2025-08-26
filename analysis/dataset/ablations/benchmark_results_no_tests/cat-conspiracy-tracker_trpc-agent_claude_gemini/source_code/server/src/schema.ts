import { z } from 'zod';

// Cat activity types with their conspiracy point values
export const catActivityTypeSchema = z.enum([
  'prolonged_staring',
  'bringing_gifts',
  'knocking_items',
  'sudden_zoomies',
  'vocalizing_at_objects',
  'hiding_under_furniture',
  'sitting_in_boxes',
  'midnight_meetings',
  'suspicious_purring',
  'ignoring_humans'
]);

export type CatActivityType = z.infer<typeof catActivityTypeSchema>;

// Cat profile schema
export const catProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  color: z.string().nullable(),
  age_years: z.number().int().nullable(),
  suspicion_level: z.enum(['low', 'medium', 'high', 'maximum']),
  created_at: z.coerce.date()
});

export type CatProfile = z.infer<typeof catProfileSchema>;

// Cat activity log schema
export const catActivityLogSchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  activity_type: catActivityTypeSchema,
  description: z.string().nullable(),
  conspiracy_points: z.number().int(),
  occurred_at: z.coerce.date(),
  logged_at: z.coerce.date()
});

export type CatActivityLog = z.infer<typeof catActivityLogSchema>;

// Daily conspiracy summary schema
export const dailyConspiracySummarySchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  date: z.string(), // YYYY-MM-DD format
  total_conspiracy_points: z.number().int(),
  conspiracy_level: z.enum(['innocent', 'suspicious', 'plotting', 'dangerous', 'world_domination']),
  activity_count: z.number().int(),
  created_at: z.coerce.date()
});

export type DailyConspiracySummary = z.infer<typeof dailyConspiracySummarySchema>;

// Input schema for creating cat profiles
export const createCatProfileInputSchema = z.object({
  name: z.string().min(1, 'Cat name is required'),
  breed: z.string().nullable(),
  color: z.string().nullable(),
  age_years: z.number().int().positive().optional(),
  suspicion_level: z.enum(['low', 'medium', 'high', 'maximum'])
});

export type CreateCatProfileInput = z.infer<typeof createCatProfileInputSchema>;

// Input schema for logging cat activities
export const logCatActivityInputSchema = z.object({
  cat_id: z.number().int().positive(),
  activity_type: catActivityTypeSchema,
  description: z.string().nullable(),
  occurred_at: z.coerce.date().optional() // Defaults to current time if not provided
});

export type LogCatActivityInput = z.infer<typeof logCatActivityInputSchema>;

// Input schema for getting activities by date range
export const getActivitiesByDateRangeInputSchema = z.object({
  cat_id: z.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export type GetActivitiesByDateRangeInput = z.infer<typeof getActivitiesByDateRangeInputSchema>;

// Input schema for getting daily summary
export const getDailySummaryInputSchema = z.object({
  cat_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export type GetDailySummaryInput = z.infer<typeof getDailySummaryInputSchema>;

// Response schema for activity with conspiracy points
export const activityWithPointsSchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  activity_type: catActivityTypeSchema,
  description: z.string().nullable(),
  conspiracy_points: z.number().int(),
  occurred_at: z.coerce.date(),
  logged_at: z.coerce.date()
});

export type ActivityWithPoints = z.infer<typeof activityWithPointsSchema>;

// Response schema for daily conspiracy report
export const dailyConspiracyReportSchema = z.object({
  cat_name: z.string(),
  date: z.string(),
  total_conspiracy_points: z.number().int(),
  conspiracy_level: z.enum(['innocent', 'suspicious', 'plotting', 'dangerous', 'world_domination']),
  activities: z.array(activityWithPointsSchema),
  level_description: z.string()
});

export type DailyConspiracyReport = z.infer<typeof dailyConspiracyReportSchema>;
