import { z } from 'zod';

// Wellness entry schema for database records
export const wellnessEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(), // For future user management
  date: z.coerce.date(), // Date of the wellness entry
  sleep_hours: z.number(), // Hours of sleep (can be decimal)
  stress_level: z.number().int().min(1).max(10), // Stress level from 1-10
  caffeine_intake: z.number().int().nonnegative(), // Caffeine intake in mg
  alcohol_intake: z.number().int().nonnegative(), // Alcohol intake in units/drinks
  wellness_score: z.number(), // Calculated wellness score
  created_at: z.coerce.date() // When the record was created
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating wellness entries
export const createWellnessEntryInputSchema = z.object({
  user_id: z.string(),
  date: z.string().date(), // Date in YYYY-MM-DD format
  sleep_hours: z.number().min(0).max(24), // Validate reasonable sleep hours
  stress_level: z.number().int().min(1).max(10), // Stress level validation
  caffeine_intake: z.number().int().nonnegative().max(2000), // Max reasonable caffeine intake
  alcohol_intake: z.number().int().nonnegative().max(50) // Max reasonable alcohol intake
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating wellness entries
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  sleep_hours: z.number().min(0).max(24).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  caffeine_intake: z.number().int().nonnegative().max(2000).optional(),
  alcohol_intake: z.number().int().nonnegative().max(50).optional()
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;

// Query schema for getting wellness entries
export const getWellnessEntriesInputSchema = z.object({
  user_id: z.string(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  limit: z.number().int().positive().max(365).optional().default(30) // Default to last 30 days
});

export type GetWellnessEntriesInput = z.infer<typeof getWellnessEntriesInputSchema>;

// Schema for getting a single wellness entry
export const getWellnessEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.string()
});

export type GetWellnessEntryInput = z.infer<typeof getWellnessEntryInputSchema>;

// Schema for deleting a wellness entry
export const deleteWellnessEntryInputSchema = z.object({
  id: z.number(),
  user_id: z.string()
});

export type DeleteWellnessEntryInput = z.infer<typeof deleteWellnessEntryInputSchema>;
