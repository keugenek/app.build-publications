import { z } from 'zod';

// Habit schema representing a habit record
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // Nullable in DB, can be explicitly null
  created_at: z.coerce.date(), // timestamp -> Date
});

export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating a habit
export const createHabitInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(), // Optional field, can be null or omitted
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating a habit
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// Habit completion schema (output)
export const habitCompletionSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  date: z.coerce.date(), // stored as DATE in DB, coerced to Date
  completed: z.boolean(),
});

export type HabitCompletion = z.infer<typeof habitCompletionSchema>;

// Input schema for marking a habit completion for a specific day
export const markHabitCompletionInputSchema = z.object({
  habit_id: z.number(),
  date: z.coerce.date().optional(), // defaults to today in implementation
  completed: z.boolean().optional().default(true),
});

export type MarkHabitCompletionInput = z.infer<typeof markHabitCompletionInputSchema>;
