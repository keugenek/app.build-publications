import { z } from 'zod';

// Activity log schema for daily tracking
export const activityLogSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_hours: z.number().min(0).max(24),
  screen_hours: z.number().min(0).max(24),
  emotional_energy: z.number().min(1).max(10), // Scale of 1-10
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ActivityLog = z.infer<typeof activityLogSchema>;

// Input schema for creating activity logs
export const createActivityLogInputSchema = z.object({
  user_id: z.string(),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_hours: z.number().min(0).max(24),
  screen_hours: z.number().min(0).max(24),
  emotional_energy: z.number().min(1).max(10),
  notes: z.string().nullable().optional()
});

export type CreateActivityLogInput = z.infer<typeof createActivityLogInputSchema>;

// Input schema for updating activity logs
export const updateActivityLogInputSchema = z.object({
  id: z.number(),
  sleep_hours: z.number().min(0).max(24).optional(),
  work_hours: z.number().min(0).max(24).optional(),
  social_hours: z.number().min(0).max(24).optional(),
  screen_hours: z.number().min(0).max(24).optional(),
  emotional_energy: z.number().min(1).max(10).optional(),
  notes: z.string().nullable().optional()
});

export type UpdateActivityLogInput = z.infer<typeof updateActivityLogInputSchema>;

// Schema for querying activity logs with date range
export const getActivityLogsInputSchema = z.object({
  user_id: z.string(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().min(1).max(100).default(30)
});

export type GetActivityLogsInput = z.infer<typeof getActivityLogsInputSchema>;

// Schema for activity patterns analysis
export const activityPatternSchema = z.object({
  user_id: z.string(),
  average_sleep: z.number(),
  average_work: z.number(),
  average_social: z.number(),
  average_screen: z.number(),
  average_energy: z.number(),
  total_days: z.number(),
  optimal_work_time: z.string().nullable(), // Suggested optimal work time based on energy patterns
  break_suggestions: z.array(z.string())
});

export type ActivityPattern = z.infer<typeof activityPatternSchema>;

// Break suggestion schema
export const breakSuggestionSchema = z.object({
  user_id: z.string(),
  suggested_time: z.string(),
  activity_type: z.enum(['short_break', 'long_break', 'social_time', 'exercise']),
  reason: z.string(),
  confidence: z.number().min(0).max(1) // Confidence level of the suggestion
});

export type BreakSuggestion = z.infer<typeof breakSuggestionSchema>;
