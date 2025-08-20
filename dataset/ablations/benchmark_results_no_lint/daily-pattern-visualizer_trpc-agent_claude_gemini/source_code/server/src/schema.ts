import { z } from 'zod';

// Well-being entry schema with proper numeric handling
export const wellBeingEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Automatically converts string dates to Date objects
  sleep_hours: z.number().min(0).max(24), // 0-24 hours validation
  work_hours: z.number().min(0).max(24), // 0-24 hours validation
  social_time_hours: z.number().min(0).max(24), // 0-24 hours validation
  screen_time_hours: z.number().min(0).max(24), // 0-24 hours validation
  emotional_energy_level: z.number().int().min(1).max(10), // 1-10 scale
  created_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type WellBeingEntry = z.infer<typeof wellBeingEntrySchema>;

// Input schema for creating well-being entries
export const createWellBeingEntryInputSchema = z.object({
  date: z.coerce.date(), // Date for the entry
  sleep_hours: z.number().min(0).max(24), // Validate sleep hours range
  work_hours: z.number().min(0).max(24), // Validate work hours range
  social_time_hours: z.number().min(0).max(24), // Validate social time range
  screen_time_hours: z.number().min(0).max(24), // Validate screen time range
  emotional_energy_level: z.number().int().min(1).max(10) // Validate energy level scale
});

export type CreateWellBeingEntryInput = z.infer<typeof createWellBeingEntryInputSchema>;

// Input schema for updating well-being entries
export const updateWellBeingEntryInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(), // Optional date update
  sleep_hours: z.number().min(0).max(24).optional(),
  work_hours: z.number().min(0).max(24).optional(),
  social_time_hours: z.number().min(0).max(24).optional(),
  screen_time_hours: z.number().min(0).max(24).optional(),
  emotional_energy_level: z.number().int().min(1).max(10).optional()
});

export type UpdateWellBeingEntryInput = z.infer<typeof updateWellBeingEntryInputSchema>;

// Query schema for filtering entries by date range
export const getWellBeingEntriesInputSchema = z.object({
  start_date: z.coerce.date().optional(), // Optional start date filter
  end_date: z.coerce.date().optional(), // Optional end date filter
  limit: z.number().int().positive().max(365).default(30) // Limit results, default 30 days
});

export type GetWellBeingEntriesInput = z.infer<typeof getWellBeingEntriesInputSchema>;

// Break suggestion schema
export const breakSuggestionSchema = z.object({
  suggestion_type: z.enum(['work_break', 'screen_break', 'general_wellness']),
  message: z.string(),
  urgency_level: z.enum(['low', 'medium', 'high']),
  recommended_action: z.string()
});

export type BreakSuggestion = z.infer<typeof breakSuggestionSchema>;

// Wellness summary schema for dashboard analytics
export const wellnessSummarySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']),
  average_sleep_hours: z.number(),
  average_work_hours: z.number(),
  average_social_time_hours: z.number(),
  average_screen_time_hours: z.number(),
  average_emotional_energy: z.number(),
  total_entries: z.number().int(),
  break_suggestions: z.array(breakSuggestionSchema)
});

export type WellnessSummary = z.infer<typeof wellnessSummarySchema>;
