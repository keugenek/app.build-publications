import { z } from 'zod';

// Habit schema (output)
export const habitSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Habit = z.infer<typeof habitSchema>;

// Input schema for creating a habit
export const createHabitInputSchema = z.object({
  name: z.string().min(1, { message: 'Habit name is required' }),
});
export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;

// Completion schema (output)
export const habitCompletionSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  date: z.string(), // Stored as date, coerced to Date
  created_at: z.coerce.date(),
});
export type HabitCompletion = z.infer<typeof habitCompletionSchema>;

// Input schema for marking a habit as completed for a specific day
export const markHabitCompletionInputSchema = z.object({
  habit_id: z.number(),
  date: z.string(), // Accept ISO string or Date
});
export type MarkHabitCompletionInput = z.infer<typeof markHabitCompletionInputSchema>;
