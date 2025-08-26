import { z } from 'zod';

// -----------------------------------------------------------------------------
// Wellness Entry schemas
// -----------------------------------------------------------------------------

// Output schema representing a stored wellness entry (including calculated score)
export const wellnessEntrySchema = z.object({
  id: z.number(),
  // Date stored in DB as `date` column (string in ISO format, e.g., "2024-08-22")
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  }),
  sleep_hours: z.number().positive(), // Can be fractional (e.g., 7.5)
  stress_level: z.number().int().min(1).max(5), // Scale 1‑5
  caffeine_servings: z.number().int().nonnegative(),
  alcohol_servings: z.number().int().nonnegative(),
  wellness_score: z.number(), // Calculated score, stored as numeric in DB
  created_at: z.coerce.date(), // Timestamp when record was created
});

export type WellnessEntry = z.infer<typeof wellnessEntrySchema>;

// Input schema for creating a new wellness entry
export const createWellnessEntryInputSchema = z.object({
  // Allow client to omit date – server will default to today
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  }).optional(),
  sleep_hours: z.number().positive(),
  stress_level: z.number().int().min(1).max(5),
  caffeine_servings: z.number().int().nonnegative(),
  alcohol_servings: z.number().int().nonnegative(),
});

export type CreateWellnessEntryInput = z.infer<typeof createWellnessEntryInputSchema>;

// Input schema for updating an existing entry (all fields optional except id)
export const updateWellnessEntryInputSchema = z.object({
  id: z.number(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  }).optional(),
  sleep_hours: z.number().positive().optional(),
  stress_level: z.number().int().min(1).max(5).optional(),
  caffeine_servings: z.number().int().nonnegative().optional(),
  alcohol_servings: z.number().int().nonnegative().optional(),
});

export type UpdateWellnessEntryInput = z.infer<typeof updateWellnessEntryInputSchema>;
