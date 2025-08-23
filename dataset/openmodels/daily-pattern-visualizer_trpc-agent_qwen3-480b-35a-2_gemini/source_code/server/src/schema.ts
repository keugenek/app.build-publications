import { z } from 'zod';

// DailyLog schema with proper numeric handling
export const dailyLogSchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Date of the log entry
  sleep_hours: z.number().min(0), // Sleep duration in hours
  work_hours: z.number().min(0), // Work hours
  social_time: z.number().min(0), // Social time in hours
  screen_time: z.number().min(0), // Screen time in hours
  emotional_energy: z.number().min(1).max(10), // Emotional energy on a scale of 1 to 10
  created_at: z.coerce.date() // Timestamp when log was created
});

export type DailyLog = z.infer<typeof dailyLogSchema>;

// Input schema for creating daily logs
export const createDailyLogInputSchema = z.object({
  date: z.coerce.date(),
  sleep_hours: z.number().min(0),
  work_hours: z.number().min(0),
  social_time: z.number().min(0),
  screen_time: z.number().min(0),
  emotional_energy: z.number().min(1).max(10)
});

export type CreateDailyLogInput = z.infer<typeof createDailyLogInputSchema>;

// Input schema for updating daily logs
export const updateDailyLogInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  sleep_hours: z.number().min(0).optional(),
  work_hours: z.number().min(0).optional(),
  social_time: z.number().min(0).optional(),
  screen_time: z.number().min(0).optional(),
  emotional_energy: z.number().min(1).max(10).optional()
});

export type UpdateDailyLogInput = z.infer<typeof updateDailyLogInputSchema>;

// Schema for break suggestions
export const breakSuggestionSchema = z.object({
  type: z.enum(['work_break', 'screen_break', 'energy_boost', 'social_suggestion']),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high'])
});

export type BreakSuggestion = z.infer<typeof breakSuggestionSchema>;
