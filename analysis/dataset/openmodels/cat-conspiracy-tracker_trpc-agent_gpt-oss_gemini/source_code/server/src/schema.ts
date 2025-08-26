import { z } from 'zod';

// Cat schema
export const catSchema = z.object({
  id: z.number(),
  name: z.string(),
  owner_name: z.string().nullable(), // nullable, can be null explicitly
  created_at: z.coerce.date()
});
export type Cat = z.infer<typeof catSchema>;

// Input schema for creating a cat
export const createCatInputSchema = z.object({
  name: z.string(),
  owner_name: z.string().nullable().optional() // optional on create, can be null
});
export type CreateCatInput = z.infer<typeof createCatInputSchema>;

// Activity schema (logged suspicious activity)
export const activitySchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  description: z.string(),
  suspicion_score: z.number(), // numeric score
  activity_date: z.coerce.date(), // date of activity (ignore time)
  created_at: z.coerce.date()
});
export type Activity = z.infer<typeof activitySchema>;

// Input schema for creating an activity
export const createActivityInputSchema = z.object({
  cat_id: z.number(),
  description: z.string(),
  suspicion_score: z.number().nonnegative(), // cannot be negative
  activity_date: z.coerce.date()
});
export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Output schema for daily conspiracy level per cat
export const dailyConspiracySchema = z.object({
  cat_id: z.number(),
  date: z.coerce.date(),
  total_score: z.number()
});
export type DailyConspiracy = z.infer<typeof dailyConspiracySchema>;
