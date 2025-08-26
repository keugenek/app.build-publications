import { z } from 'zod';

// Habit schema
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Habit = z.infer<typeof habitSchema>;

// Habit check-in schema
export const habitCheckInSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type HabitCheckIn = z.infer<typeof habitCheckInSchema>;

// Input schema for creating habits
export const createHabitInputSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  description: z.string().nullable().optional()
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating habits
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// Input schema for checking in a habit
export const checkInHabitInputSchema = z.object({
  habit_id: z.number(),
  completed_at: z.coerce.date().optional() // Defaults to current date if not provided
});

export type CheckInHabitInput = z.infer<typeof checkInHabitInputSchema>;

// Habit with streak information
export const habitWithStreakSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  current_streak: z.number().int().nonnegative(),
  last_completed: z.coerce.date().nullable()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;
