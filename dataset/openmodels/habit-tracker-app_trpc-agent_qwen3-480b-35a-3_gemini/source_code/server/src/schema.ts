import { z } from 'zod';

// Habit schema
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Habit = z.infer<typeof habitSchema>;

// Habit completion schema
export const habitCompletionSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  date: z.coerce.date(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});

export type HabitCompletion = z.infer<typeof habitCompletionSchema>;

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

// Input schema for marking habit completion
export const markHabitCompletionInputSchema = z.object({
  habit_id: z.number(),
  date: z.coerce.date(),
  completed: z.boolean()
});

export type MarkHabitCompletionInput = z.infer<typeof markHabitCompletionInputSchema>;

// Habit with streak schema
export const habitWithStreakSchema = habitSchema.extend({
  current_streak: z.number(),
  longest_streak: z.number()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;
