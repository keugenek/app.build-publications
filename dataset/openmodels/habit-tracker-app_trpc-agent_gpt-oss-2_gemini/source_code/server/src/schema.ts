// Zod schemas for the habit tracking application
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Habit schemas
// ---------------------------------------------------------------------------
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // description can be null
  created_at: z.coerce.date(),
});

export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating a habit
export const createHabitInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(), // null allowed, undefined not allowed
});

export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Input schema for updating a habit
export const updateHabitInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;

// ---------------------------------------------------------------------------
// Habit check (daily progress) schemas
// ---------------------------------------------------------------------------
export const habitCheckSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  check_date: z.coerce.date(),
  completed: z.boolean(),
});

export type HabitCheck = z.infer<typeof habitCheckSchema>;

// Input schema for creating a habit check (check‑in)
export const createHabitCheckInputSchema = z.object({
  habit_id: z.number(),
  // Optional date – defaults to today on the backend implementation
  check_date: z.coerce.date().optional(),
});

export type CreateHabitCheckInput = z.infer<typeof createHabitCheckInputSchema>;
