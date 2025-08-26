import { z } from 'zod';

// Wellness entry schema
export const wellnessEntrySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  hours_of_sleep: z.number(),
  stress_level: z.number().int().min(1).max(10), // 1-10 scale
  caffeine_intake: z.number().nonnegative(), // in mg
  alcohol_intake: z.number().nonnegative(), // number of drinks
  wellness_score: z.number(), // calculated score
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  user_id: z.number(),
  date: z.coerce.date(),
  hours_of_sleep: z.number().min(0).max(24), // 0-24 hours
  stress_level: z.number().int().min(1).max(10), // 1-10 scale
  caffeine_intake: z.number().nonnegative(), // in mg
  alcohol_intake: z.number().nonnegative() // number of drinks
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  hours_of_sleep: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  caffeine_intake: z.number().nonnegative().optional(),
  alcohol_intake: z.number().nonnegative().optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;

// Query schema for getting wellness entries by date range
export const getWellnessEntriesInputSchema = z.object({
  user_id: z.number(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).optional() // Max 100 entries per request
});

export type GetWellnessEntriesInput = z.infer<typeof getWellnessEntriesInputSchema>;

// Query schema for getting a single wellness entry
export const getWellnessEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type GetWellnessEntryInput = z.infer<typeof getWellnessEntryInputSchema>;

// Wellness trend data schema for analytics
export const wellnessTrendSchema = z.object({
  date: z.coerce.date(),
  wellness_score: z.number(),
  hours_of_sleep: z.number(),
  stress_level: z.number(),
  caffeine_intake: z.number(),
  alcohol_intake: z.number()
});

export type WellnessTrend = z.infer<typeof wellnessTrendSchema>;
