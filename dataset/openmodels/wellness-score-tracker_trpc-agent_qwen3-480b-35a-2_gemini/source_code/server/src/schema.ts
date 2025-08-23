import { z } from 'zod';

// Wellness entry schema with proper numeric handling
export const wellnessEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Automatically converts string timestamps to Date objects
  sleep_hours: z.number().min(0), // Hours of sleep (non-negative)
  stress_level: z.number().min(1).max(10), // Stress level (1-10 scale)
  caffeine_intake: z.number().min(0), // Caffeine intake (non-negative)
  alcohol_intake: z.number().min(0), // Alcohol intake (non-negative)
  wellness_score: z.number(), // Calculated wellness score
  created_at: z.coerce.date(), // Record creation timestamp
  updated_at: z.coerce.date(), // Record last update timestamp
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  date: z.coerce.date(),
  sleep_hours: z.number().min(0),
  stress_level: z.number().min(1).max(10),
  caffeine_intake: z.number().min(0),
  alcohol_intake: z.number().min(0),
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  sleep_hours: z.number().min(0).optional(),
  stress_level: z.number().min(1).max(10).optional(),
  caffeine_intake: z.number().min(0).optional(),
  alcohol_intake: z.number().min(0).optional(),
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;
