import { z } from 'zod';

// Wellness entry schema
export const wellnessEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Date of the entry
  sleep_hours: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val), // Hours of sleep (0-24)
  stress_level: z.number(), // Stress level (1-10)
  caffeine_intake: z.number(), // Number of caffeine drinks
  alcohol_intake: z.number(), // Number of alcohol drinks
  wellness_score: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val), // Calculated wellness score
  created_at: z.coerce.date(), // When the entry was created
  updated_at: z.coerce.date(), // When the entry was last updated
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  date: z.coerce.date(),
  sleep_hours: z.number().min(0).max(24),
  stress_level: z.number().min(1).max(10),
  caffeine_intake: z.number().nonnegative(),
  alcohol_intake: z.number().nonnegative(),
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().min(1).max(10).optional(),
  caffeine_intake: z.number().nonnegative().optional(),
  alcohol_intake: z.number().nonnegative().optional(),
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;

// Schema for wellness trends
export const wellnessTrendSchema = z.object({
  date: z.coerce.date(),
  wellness_score: z.number(),
});

export type WellnessTrend = z.infer<typeof wellnessTrendSchema>;
