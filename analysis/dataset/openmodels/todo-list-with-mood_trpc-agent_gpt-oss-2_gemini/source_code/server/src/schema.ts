// Zod schemas for the Daily Journal application
import { z } from 'zod';

// ---------- Task Schemas ----------
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // description can be explicitly null
  completed: z.boolean(),
  created_at: z.coerce.date(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(), // defaults to false in DB
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// ---------- Mood Schemas ----------
export const MoodEnum = z.enum(['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited']);
export type Mood = z.infer<typeof MoodEnum>;

export const moodLogSchema = z.object({
  id: z.number(),
  mood: MoodEnum,
  log_date: z.coerce.date(), // store as date, coerce from string
  note: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type MoodLog = z.infer<typeof moodLogSchema>;

export const createMoodLogInputSchema = z.object({
  mood: MoodEnum,
  log_date: z.coerce.date(),
  note: z.string().nullable().optional(),
});
export type CreateMoodLogInput = z.infer<typeof createMoodLogInputSchema>;

export const updateMoodLogInputSchema = z.object({
  id: z.number(),
  mood: MoodEnum.optional(),
  log_date: z.coerce.date().optional(),
  note: z.string().nullable().optional(),
});
export type UpdateMoodLogInput = z.infer<typeof updateMoodLogInputSchema>;
