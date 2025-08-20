import { z } from 'zod';

// Cat schema
export const catSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  age: z.number().int().nullable(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Cat = z.infer<typeof catSchema>;

// Input schema for creating cats
export const createCatInputSchema = z.object({
  name: z.string().min(1, "Cat name is required"),
  breed: z.string().nullable(),
  age: z.number().int().positive().nullable(),
  description: z.string().nullable()
});

export type CreateCatInput = z.infer<typeof createCatInputSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  activity_type: z.string(),
  description: z.string().nullable(),
  conspiracy_score: z.number().int(),
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Activity = z.infer<typeof activitySchema>;

// Input schema for creating activities
export const createActivityInputSchema = z.object({
  cat_id: z.number(),
  activity_type: z.string().min(1, "Activity type is required"),
  description: z.string().nullable(),
  conspiracy_score: z.number().int().min(1).max(10), // Conspiracy score from 1-10
  recorded_at: z.coerce.date().optional() // Defaults to current time if not provided
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Daily conspiracy level schema
export const dailyConspiracyLevelSchema = z.object({
  date: z.string(), // YYYY-MM-DD format
  cat_id: z.number(),
  cat_name: z.string(),
  total_conspiracy_score: z.number().int(),
  activity_count: z.number().int(),
  conspiracy_level: z.string() // Descriptive level like "Mildly Suspicious", "Plotting World Domination"
});

export type DailyConspiracyLevel = z.infer<typeof dailyConspiracyLevelSchema>;

// Input schema for getting daily conspiracy levels
export const getDailyConspiracyInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  cat_id: z.number().optional() // If not provided, gets levels for all cats
});

export type GetDailyConspiracyInput = z.infer<typeof getDailyConspiracyInputSchema>;
