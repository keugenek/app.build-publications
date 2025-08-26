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
export const habitCheckinSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  date: z.coerce.date(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});

export type HabitCheckin = z.infer<typeof habitCheckinSchema>;

// Input schema for creating habits
export const createHabitInputSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  description: z.string().nullable().optional()
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for marking habit completion
export const markHabitCompleteInputSchema = z.object({
  habit_id: z.number(),
  date: z.string().date(), // ISO date string (YYYY-MM-DD)
  completed: z.boolean()
});

export type MarkHabitCompleteInput = z.infer<typeof markHabitCompleteInputSchema>;

// Input schema for getting habit streak
export const getHabitStreakInputSchema = z.object({
  habit_id: z.number()
});

export type GetHabitStreakInput = z.infer<typeof getHabitStreakInputSchema>;

// Habit with streak information
export const habitWithStreakSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  current_streak: z.number(),
  longest_streak: z.number(),
  completed_today: z.boolean()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;
