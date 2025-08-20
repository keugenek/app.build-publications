import { z } from 'zod';

// Wellness entry schema
export const wellnessEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24), // Hours of sleep (0-24)
  stress_level: z.number().int().min(1).max(10), // Stress level (1-10 scale)
  caffeine_intake: z.number().min(0), // Caffeine intake in mg
  alcohol_intake: z.number().min(0), // Alcohol intake in standard drinks
  wellness_score: z.number().min(0).max(100), // Calculated wellness score (0-100)
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  user_id: z.string().min(1),
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  stress_level: z.number().int().min(1).max(10),
  caffeine_intake: z.number().min(0),
  alcohol_intake: z.number().min(0)
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  caffeine_intake: z.number().min(0).optional(),
  alcohol_intake: z.number().min(0).optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;

// Input schema for querying wellness entries by user and date range
export const getWellnessEntriesInputSchema = z.object({
  user_id: z.string().min(1),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).default(30) // Limit results, default 30 days
});

export type GetWellnessEntriesInput = z.infer<typeof getWellnessEntriesInputSchema>;

// Input schema for getting a single wellness entry
export const getWellnessEntryInputSchema = z.object({
  id: z.number()
});

export type GetWellnessEntryInput = z.infer<typeof getWellnessEntryInputSchema>;

// Schema for wellness trends response
export const wellnessTrendSchema = z.object({
  date: z.coerce.date(),
  sleep_hours: z.number(),
  stress_level: z.number(),
  caffeine_intake: z.number(),
  alcohol_intake: z.number(),
  wellness_score: z.number()
});

export type WellnessTrend = z.infer<typeof wellnessTrendSchema>;

// Input schema for deleting wellness entry
export const deleteWellnessEntryInputSchema = z.object({
  id: z.number()
});

export type DeleteWellnessEntryInput = z.infer<typeof deleteWellnessEntryInputSchema>;
