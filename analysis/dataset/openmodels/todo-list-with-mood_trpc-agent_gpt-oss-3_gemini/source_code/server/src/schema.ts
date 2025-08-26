import { z } from 'zod';

/**
 * Task schemas
 */
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // nullable, not optional
  completed: z.boolean(),
  due_date: z.coerce.date().nullable(), // nullable date, can be null
  created_at: z.coerce.date(),
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(), // optional on create, can be null
  completed: z.boolean().optional(), // default false in DB, optional here
  due_date: z.coerce.date().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  due_date: z.coerce.date().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

/**
 * Mood entry schemas
 */
export const moodEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // date of the mood entry
  rating: z.number().int().min(1).max(10), // rating from 1 to 10
  note: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

export const createMoodEntryInputSchema = z.object({
  date: z.coerce.date(),
  rating: z.number().int().min(1).max(10),
  note: z.string().nullable().optional(),
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

export const updateMoodEntryInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(),
  rating: z.number().int().min(1).max(10).optional(),
  note: z.string().nullable().optional(),
});

export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntryInputSchema>;
