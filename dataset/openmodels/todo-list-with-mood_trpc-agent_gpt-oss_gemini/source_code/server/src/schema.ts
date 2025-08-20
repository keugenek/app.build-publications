import { z } from 'zod';

// Mood enum definition
export const moodEnum = z.enum(['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited']);
export type Mood = z.infer<typeof moodEnum>;

// Task schema (output)
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // can be null explicitly
  completed: z.boolean(),
  due_date: z.coerce.date().nullable(), // nullable timestamp
  created_at: z.coerce.date(),
});
export type Task = z.infer<typeof taskSchema>;

// Input schema for creating a task
export const createTaskInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(), // defaults to false in DB
  due_date: z.coerce.date().nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating a task
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  due_date: z.coerce.date().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Mood entry schema (output)
export const moodEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  mood: moodEnum,
  note: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for logging a mood entry
export const createMoodInputSchema = z.object({
  date: z.coerce.date().optional(), // if omitted, server can set to today
  mood: moodEnum,
  note: z.string().nullable().optional(),
});
export type CreateMoodInput = z.infer<typeof createMoodInputSchema>;
