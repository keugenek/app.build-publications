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
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable()
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating habits
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
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
  date: z.coerce.date(),
  completed: z.boolean()
});

export type TrackHabitInput = z.infer<typeof trackHabitInputSchema>;

// Habit with streak information
export const habitWithStreakSchema = habitSchema.extend({
  current_streak: z.number(),
  longest_streak: z.number()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;
