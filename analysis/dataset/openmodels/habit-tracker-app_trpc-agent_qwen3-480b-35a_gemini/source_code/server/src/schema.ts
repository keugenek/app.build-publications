import { z } from 'zod';

// Habit schema 
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating habits
export const createHabitInputSchema = z.object({
  name: z.string().min(1, "Habit name is required")
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating habits
export const updateHabitInputSchema = z.object({
  id: z.number(),
  is_completed_today: z.boolean().optional()
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// Habit with streak information
export const habitWithStreakSchema = habitSchema.extend({
  is_completed_today: z.boolean(),
  current_streak: z.number().int().nonnegative(),
  longest_streak: z.number().int().nonnegative()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;
