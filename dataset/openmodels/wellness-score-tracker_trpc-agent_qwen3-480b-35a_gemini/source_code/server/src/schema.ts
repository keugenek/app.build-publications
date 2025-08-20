import { z } from 'zod';

// Wellness entry schema with proper numeric handling
export const wellnessEntrySchema = z.object({
  id: z.number(),
  sleep_hours: z.number(), // Stored as numeric in DB, but we use number in TS
  stress_level: z.number().int().min(1).max(10), // 1-10 scale
  caffeine_intake: z.number().int().nonnegative(), // Number of servings
  alcohol_intake: z.number().int().nonnegative(), // Number of units
  wellness_score: z.number(), // Calculated score
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  user_id: z.string()
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  sleep_hours: z.number().min(0).max(24), // Hours of sleep (0-24 hours)
  stress_level: z.number().int().min(1).max(10), // Stress level 1-10
  caffeine_intake: z.number().int().nonnegative(), // Number of caffeine servings
  alcohol_intake: z.number().int().nonnegative(), // Number of alcohol units
  user_id: z.string()
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  caffeine_intake: z.number().int().nonnegative().optional(),
  alcohol_intake: z.number().int().nonnegative().optional(),
  user_id: z.string().optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;
