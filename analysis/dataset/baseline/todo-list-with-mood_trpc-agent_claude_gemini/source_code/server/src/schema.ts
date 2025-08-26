import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Mood entry schema
export const moodEntrySchema = z.object({
  id: z.number(),
  mood_rating: z.number().int().min(1).max(5),
  note: z.string().nullable(),
  date: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for creating mood entries
export const createMoodEntryInputSchema = z.object({
  mood_rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  note: z.string().nullable(),
  date: z.string().optional(), // Optional date string, defaults to today
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

// Input schema for updating mood entries
export const updateMoodEntryInputSchema = z.object({
  id: z.number(),
  mood_rating: z.number().int().min(1).max(5).optional(),
  note: z.string().nullable().optional(),
});

export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntryInputSchema>;

// Daily summary schema for aggregated data
export const dailySummarySchema = z.object({
  date: z.coerce.date(),
  completed_tasks: z.array(taskSchema),
  mood_entry: moodEntrySchema.nullable(),
  total_tasks: z.number(),
  completed_tasks_count: z.number(),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

// Query parameters for date filtering
export const dateRangeInputSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;
