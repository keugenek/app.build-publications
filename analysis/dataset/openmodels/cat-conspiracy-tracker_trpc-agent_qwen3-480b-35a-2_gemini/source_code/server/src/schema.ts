import { z } from 'zod';

// Behavior types enum
export const behaviorTypeEnum = z.enum([
  'STARE_DOWN', 
  'GIFT_BRINGING',
  'LURKING',
  'WINDOW_SURVEILLANCE',
  'NIGHT_PATROL',
  'FOOD_HOARDING',
  'ATTACK_FEET',
  'KNOCK_OFF',
  'HIDE_TOYS',
  'SECRET_MEETING'
]);

export type BehaviorType = z.infer<typeof behaviorTypeEnum>;

// Cat schema
export const catSchema = z.object({
  id: z.number(),
  name: z.string(),
  breed: z.string().nullable(),
  age: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type Cat = z.infer<typeof catSchema>;

// Behavior schema
export const behaviorSchema = z.object({
  id: z.number(),
  cat_id: z.number(),
  behavior_type: behaviorTypeEnum,
  description: z.string().nullable(),
  intensity: z.number().int().min(1).max(10), // 1-10 scale
  duration_minutes: z.number().int().nullable(),
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Behavior = z.infer<typeof behaviorSchema>;

// Input schema for creating cats
export const createCatInputSchema = z.object({
  name: z.string().min(1).max(50),
  breed: z.string().nullable(),
  age: z.number().int().nonnegative().nullable()
});

export type CreateCatInput = z.infer<typeof createCatInputSchema>;

// Input schema for updating cats
export const updateCatInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50).optional(),
  breed: z.string().nullable().optional(),
  age: z.number().int().nonnegative().nullable().optional()
});

export type UpdateCatInput = z.infer<typeof updateCatInputSchema>;

// Input schema for recording behaviors
export const recordBehaviorInputSchema = z.object({
  cat_id: z.number(),
  behavior_type: behaviorTypeEnum,
  description: z.string().nullable(),
  intensity: z.number().int().min(1).max(10),
  duration_minutes: z.number().int().nonnegative().nullable(),
  recorded_at: z.coerce.date().optional()
});

export type RecordBehaviorInput = z.infer<typeof recordBehaviorInputSchema>;

// Conspiracy level result
export const conspiracyLevelSchema = z.object({
  cat_id: z.number(),
  cat_name: z.string(),
  level: z.number(), // 0-100 scale
  description: z.string(),
  total_behaviors: z.number(),
  date: z.coerce.date()
});

export type ConspiracyLevel = z.infer<typeof conspiracyLevelSchema>;

// Get conspiracy levels input
export const getConspiracyLevelsInputSchema = z.object({
  date: z.coerce.date().optional(),
  cat_id: z.number().optional()
});

export type GetConspiracyLevelsInput = z.infer<typeof getConspiracyLevelsInputSchema>;
