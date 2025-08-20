import { z } from 'zod';

// Cat schema
export const catSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Cat = z.infer<typeof catSchema>;

// Input schema for creating cats
export const createCatInputSchema = z.object({
  name: z.string().min(1, 'Cat name is required'),
  description: z.string().nullable()
});

export type CreateCatInput = z.infer<typeof createCatInputSchema>;

// Activity type schema
export const activityTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  suspicion_points: z.number().int(),
  created_at: z.coerce.date()
});

export type ActivityType = z.infer<typeof activityTypeSchema>;

// Input schema for creating activity types
export const createActivityTypeInputSchema = z.object({
  name: z.string().min(1, 'Activity name is required'),
  description: z.string().nullable(),
  suspicion_points: z.number().int().min(1, 'Suspicion points must be at least 1')
});

export type CreateActivityTypeInput = z.infer<typeof createActivityTypeInputSchema>;

// Suspicious activity schema
export const suspiciousActivitySchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  activity_type_id: z.number(),
  notes: z.string().nullable(),
  logged_at: z.coerce.date(),
  activity_date: z.string() // Date string in YYYY-MM-DD format
});

export type SuspiciousActivity = z.infer<typeof suspiciousActivitySchema>;

// Input schema for logging suspicious activities
export const logSuspiciousActivityInputSchema = z.object({
  cat_id: z.number(),
  activity_type_id: z.number(),
  notes: z.string().nullable(),
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export type LogSuspiciousActivityInput = z.infer<typeof logSuspiciousActivityInputSchema>;

// Schema for activity with expanded details (including activity type info)
export const expandedSuspiciousActivitySchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  activity_type_id: z.number(),
  notes: z.string().nullable(),
  logged_at: z.coerce.date(),
  activity_date: z.string(),
  activity_name: z.string(),
  activity_description: z.string().nullable(),
  suspicion_points: z.number().int()
});

export type ExpandedSuspiciousActivity = z.infer<typeof expandedSuspiciousActivitySchema>;

// Schema for daily conspiracy level calculation
export const dailyConspiracyLevelSchema = z.object({
  cat_id: z.number(),
  cat_name: z.string(),
  date: z.string(),
  total_suspicion_points: z.number().int(),
  activity_count: z.number().int(),
  conspiracy_level: z.enum(['LOW', 'MODERATE', 'HIGH', 'EXTREME', 'WORLD_DOMINATION'])
});

export type DailyConspiracyLevel = z.infer<typeof dailyConspiracyLevelSchema>;

// Input schema for getting conspiracy level
export const getConspiracyLevelInputSchema = z.object({
  cat_id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export type GetConspiracyLevelInput = z.infer<typeof getConspiracyLevelInputSchema>;
