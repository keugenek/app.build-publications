import { z } from 'zod';

// Habit schema
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating habits
export const createHabitInputSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  description: z.string().nullable()
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating habits
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Habit name is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// Habit tracking schema
export const habitTrackingSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  date: z.coerce.date(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});

export type HabitTracking = z.infer<typeof habitTrackingSchema>;

// Input schema for tracking habit progress
export const trackHabitInputSchema = z.object({
  habit_id: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  completed: z.boolean()
});

export type TrackHabitInput = z.infer<typeof trackHabitInputSchema>;

// Habit with streak information
export const habitWithStreakSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  current_streak: z.number().int().nonnegative()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;

// Input schema for getting habit progress
export const getHabitProgressInputSchema = z.object({
  habit_id: z.number(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
});

export type GetHabitProgressInput = z.infer<typeof getHabitProgressInputSchema>;
