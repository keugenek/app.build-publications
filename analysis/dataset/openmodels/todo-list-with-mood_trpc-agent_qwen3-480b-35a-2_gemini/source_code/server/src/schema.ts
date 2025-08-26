import { z } from 'zod';

// Mood enum schema
export const moodEnum = z.enum(['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited']);
export type Mood = z.infer<typeof moodEnum>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Mood log schema
export const moodLogSchema = z.object({
  id: z.number(),
  mood: moodEnum,
  note: z.string().nullable(),
  logged_at: z.coerce.date()
});

export type MoodLog = z.infer<typeof moodLogSchema>;

// Input schemas for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  due_date: z.coerce.date()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().optional(),
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for logging mood
export const createMoodLogInputSchema = z.object({
  mood: moodEnum,
  note: z.string().nullable()
});

export type CreateMoodLogInput = z.infer<typeof createMoodLogInputSchema>;

// Input schema for updating mood logs
export const updateMoodLogInputSchema = z.object({
  id: z.number(),
  mood: moodEnum.optional(),
  note: z.string().nullable().optional()
});

export type UpdateMoodLogInput = z.infer<typeof updateMoodLogInputSchema>;
