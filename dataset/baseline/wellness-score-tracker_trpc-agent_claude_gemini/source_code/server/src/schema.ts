import { z } from 'zod';

// Wellness entry schema - represents a complete daily wellness record
export const wellnessEntrySchema = z.object({
  id: z.number(),
  sleep_hours: z.number(),
  stress_level: z.number().int(), // Integer scale (1-10)
  caffeine_intake: z.number(), // Amount in mg
  alcohol_intake: z.number(), // Amount in units
  wellness_score: z.number(), // Calculated score (0-100)
  entry_date: z.coerce.date(), // Date of the wellness entry
  created_at: z.coerce.date()
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  sleep_hours: z.number().min(0).max(24), // Validate reasonable sleep hours
  stress_level: z.number().int().min(1).max(10), // Stress scale 1-10
  caffeine_intake: z.number().min(0), // Non-negative caffeine in mg
  alcohol_intake: z.number().min(0), // Non-negative alcohol units
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  caffeine_intake: z.number().min(0).optional(),
  alcohol_intake: z.number().min(0).optional(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;

// Query schema for getting wellness entries by date range
export const getWellnessEntriesInputSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Optional start date filter
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Optional end date filter
  limit: z.number().int().positive().max(1000).optional() // Optional limit for results
});

export type GetWellnessEntriesInput = z.infer<typeof getWellnessEntriesInputSchema>;

// Wellness trends response schema
export const wellnessTrendsSchema = z.object({
  entries: z.array(wellnessEntrySchema),
  average_wellness_score: z.number(),
  average_sleep_hours: z.number(),
  average_stress_level: z.number(),
  average_caffeine_intake: z.number(),
  average_alcohol_intake: z.number(),
  total_entries: z.number()
});

export type WellnessTrends = z.infer<typeof wellnessTrendsSchema>;
