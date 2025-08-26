import { z } from 'zod';

// Activity entry schema
export const activityEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_time: z.number().min(0).max(24),
  screen_time: z.number().min(0).max(24),
  emotional_energy: z.number().min(1).max(10),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type ActivityEntry = z.infer<typeof activityEntrySchema>;

// Input schema for creating activity entries
export const createActivityEntryInputSchema = z.object({
  user_id: z.string(),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  work_hours: z.number().min(0).max(24),
  social_time: z.number().min(0).max(24),
  screen_time: z.number().min(0).max(24),
  emotional_energy: z.number().min(1).max(10),
});

export type CreateActivityEntryInput = z.infer<typeof createActivityEntryInputSchema>;

// Input schema for updating activity entries
export const updateActivityEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.string().optional(),
  date: z.coerce.date().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  work_hours: z.number().min(0).max(24).optional(),
  social_time: z.number().min(0).max(24).optional(),
  screen_time: z.number().min(0).max(24).optional(),
  emotional_energy: z.number().min(1).max(10).optional(),
});

export type UpdateActivityEntryInput = z.infer<typeof updateActivityEntryInputSchema>;

// Schema for activity suggestions
export const suggestionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  message: z.string(),
  suggestion_type: z.enum(['break', 'rest', 'social', 'sleep']),
  created_at: z.coerce.date(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
