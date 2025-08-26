import { z } from 'zod';

// Wellness entry schema (output)
export const wellnessEntrySchema = z.object({
  id: z.number(),
  entry_date: z.coerce.date(), // timestamp from DB
  sleep_hours: z.number().min(0).max(24),
  stress_level: z.number().int().min(0).max(10),
  caffeine_intake: z.number().nonnegative(),
  alcohol_intake: z.number().nonnegative(),
  wellness_score: z.number(),
  created_at: z.coerce.date()
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating a wellness entry
export const createWellnessEntryInputSchema = z.object({
  entry_date: z.coerce.date().optional(), // optional, defaults to now
  sleep_hours: z.number().min(0).max(24),
  stress_level: z.number().int().min(0).max(10),
  caffeine_intake: z.number().nonnegative(),
  alcohol_intake: z.number().nonnegative()
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating a wellness entry (optional fields)
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  entry_date: z.coerce.date().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(0).max(10).optional(),
  caffeine_intake: z.number().nonnegative().optional(),
  alcohol_intake: z.number().nonnegative().optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;
