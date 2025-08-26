import { z } from 'zod';

// Behavior Type schema
export const behaviorTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  conspiracy_score: z.number().int(),
  is_custom: z.boolean(),
  created_at: z.coerce.date()
});

export type BehaviorType = z.infer<typeof behaviorTypeSchema>;

// Cat Activity schema
export const catActivitySchema = z.object({
  id: z.number(),
  behavior_type_id: z.number(),
  description: z.string(),
  cat_name: z.string().nullable(),
  activity_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type CatActivity = z.infer<typeof catActivitySchema>;

// Daily Conspiracy Level schema
export const dailyConspiracyLevelSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  total_conspiracy_score: z.number().int(),
  activity_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyConspiracyLevel = z.infer<typeof dailyConspiracyLevelSchema>;

// Input schema for creating behavior types
export const createBehaviorTypeInputSchema = z.object({
  name: z.string().min(1, "Behavior type name is required"),
  conspiracy_score: z.number().int().min(1).max(10),
  is_custom: z.boolean().default(true)
});

export type CreateBehaviorTypeInput = z.infer<typeof createBehaviorTypeInputSchema>;

// Input schema for updating behavior types
export const updateBehaviorTypeInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  conspiracy_score: z.number().int().min(1).max(10).optional()
});

export type UpdateBehaviorTypeInput = z.infer<typeof updateBehaviorTypeInputSchema>;

// Input schema for creating cat activities
export const createCatActivityInputSchema = z.object({
  behavior_type_id: z.number(),
  description: z.string().min(1, "Description is required"),
  cat_name: z.string().nullable(),
  activity_date: z.coerce.date()
});

export type CreateCatActivityInput = z.infer<typeof createCatActivityInputSchema>;

// Input schema for updating cat activities
export const updateCatActivityInputSchema = z.object({
  id: z.number(),
  behavior_type_id: z.number().optional(),
  description: z.string().min(1).optional(),
  cat_name: z.string().nullable().optional(),
  activity_date: z.coerce.date().optional()
});

export type UpdateCatActivityInput = z.infer<typeof updateCatActivityInputSchema>;

// Input schema for getting activities by date range
export const getActivitiesByDateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type GetActivitiesByDateRangeInput = z.infer<typeof getActivitiesByDateRangeInputSchema>;

// Input schema for getting conspiracy levels by date range
export const getConspiracyLevelsByDateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type GetConspiracyLevelsByDateRangeInput = z.infer<typeof getConspiracyLevelsByDateRangeInputSchema>;

// Input schema for getting daily conspiracy level by date
export const getDailyConspiracyLevelInputSchema = z.object({
  date: z.coerce.date()
});

export type GetDailyConspiracyLevelInput = z.infer<typeof getDailyConspiracyLevelInputSchema>;

// Activity with behavior type details (for joined queries)
export const activityWithBehaviorTypeSchema = z.object({
  id: z.number(),
  behavior_type_id: z.number(),
  description: z.string(),
  cat_name: z.string().nullable(),
  activity_date: z.coerce.date(),
  created_at: z.coerce.date(),
  behavior_type: behaviorTypeSchema
});

export type ActivityWithBehaviorType = z.infer<typeof activityWithBehaviorTypeSchema>;
