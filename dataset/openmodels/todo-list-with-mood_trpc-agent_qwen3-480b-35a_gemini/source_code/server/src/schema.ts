import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number(),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Mood entry schema
export const moodEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  mood_level: z.number().int().min(1).max(10),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for creating mood entries
export const createMoodEntryInputSchema = z.object({
  date: z.coerce.date(),
  mood_level: z.number().int().min(1).max(10),
  notes: z.string().nullable().optional(),
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

// Input schema for updating mood entries
export const updateMoodEntryInputSchema = z.object({
  id: z.number(),
  mood_level: z.number().int().min(1).max(10).optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntryInputSchema>;

// Input schema for deleting mood entries
export const deleteMoodEntryInputSchema = z.object({
  id: z.number(),
});

export type DeleteMoodEntryInput = z.infer<typeof deleteMoodEntryInputSchema>;

// Historical view schema
export const historicalViewEntrySchema = z.object({
  date: z.coerce.date(),
  mood_level: z.number().int().min(1).max(10).nullable(),
  notes: z.string().nullable(),
  tasks_completed: z.number().int().nonnegative(),
  total_tasks: z.number().int().nonnegative(),
});

export type HistoricalViewEntry = z.infer<typeof historicalViewEntrySchema>;
