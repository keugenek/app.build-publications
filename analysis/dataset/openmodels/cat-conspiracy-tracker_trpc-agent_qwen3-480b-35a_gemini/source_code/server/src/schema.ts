import { z } from 'zod';

// Define the suspicious activity types enum
export const suspiciousActivityTypeEnum = z.enum([
  'PROLONGED_STARE',
  'GIFT_BRINGING',
  'SUDDEN_PURRING',
  'AGGRESSIVE_KNEADING',
  'MIDDLE_OF_NIGHT_ZOOMIES',
  'ATTACKING_INVISIBLE_ENEMIES',
  'SITTING_IN_FRONT_OF_MONITOR',
  'KNOCKING_THINGS_OFF_COUNTERS',
  'HIDING_AND_POUNCE',
  'CONSTANT_OBSERVATION'
]);

export type SuspiciousActivityType = z.infer<typeof suspiciousActivityTypeEnum>;

// Suspicious activity schema
export const suspiciousActivitySchema = z.object({
  id: z.number(),
  description: z.string(),
  activity_type: suspiciousActivityTypeEnum,
  conspiracy_points: z.number().int().positive(), // Points contributing to conspiracy level
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type SuspiciousActivity = z.infer<typeof suspiciousActivitySchema>;

// Input schema for creating suspicious activities
export const createSuspiciousActivityInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  activity_type: suspiciousActivityTypeEnum,
  conspiracy_points: z.number().int().positive().max(100, "Conspiracy points cannot exceed 100")
});

export type CreateSuspiciousActivityInput = z.infer<typeof createSuspiciousActivityInputSchema>;

// Schema for daily conspiracy level
export const dailyConspiracyLevelSchema = z.object({
  date: z.coerce.date(),
  total_points: z.number().int().nonnegative(),
  activity_count: z.number().int().nonnegative()
});

export type DailyConspiracyLevel = z.infer<typeof dailyConspiracyLevelSchema>;
