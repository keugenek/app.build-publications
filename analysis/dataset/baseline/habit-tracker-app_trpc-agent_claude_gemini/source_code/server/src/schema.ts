import { z } from 'zod';

// Habit schema
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating habits
export const createHabitInputSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  description: z.string().nullable().optional()
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating habits
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Habit name is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// Habit completion schema
export const habitCompletionSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type HabitCompletion = z.infer<typeof habitCompletionSchema>;

// Input schema for marking habit as completed
export const markHabitCompletedInputSchema = z.object({
  habit_id: z.number(),
  completed_at: z.coerce.date().optional() // Defaults to current date if not provided
});

export type MarkHabitCompletedInput = z.infer<typeof markHabitCompletedInputSchema>;

// Input schema for removing habit completion
export const removeHabitCompletionInputSchema = z.object({
  habit_id: z.number(),
  completed_at: z.coerce.date()
});

export type RemoveHabitCompletionInput = z.infer<typeof removeHabitCompletionInputSchema>;

// Habit with streak information schema
export const habitWithStreakSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  current_streak: z.number(),
  longest_streak: z.number(),
  total_completions: z.number(),
  is_completed_today: z.boolean()
});

export type HabitWithStreak = z.infer<typeof habitWithStreakSchema>;

// Input schema for getting habit completions by date range
export const getHabitCompletionsInputSchema = z.object({
  habit_id: z.number().optional(), // Optional - if not provided, get all habits
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type GetHabitCompletionsInput = z.infer<typeof getHabitCompletionsInputSchema>;

// Delete habit input schema
export const deleteHabitInputSchema = z.object({
  id: z.number()
});

export type DeleteHabitInput = z.infer<typeof deleteHabitInputSchema>;
