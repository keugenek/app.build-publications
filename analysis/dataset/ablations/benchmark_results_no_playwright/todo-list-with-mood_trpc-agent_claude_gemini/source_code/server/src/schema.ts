import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  description: z.string().min(1, "Task description is required")
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Mood entry schema
export const moodEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  mood_score: z.number().int().min(1).max(5),
  note: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for creating mood entries
export const createMoodEntryInputSchema = z.object({
  date: z.string(), // ISO date string (YYYY-MM-DD)
  mood_score: z.number().int().min(1).max(5),
  note: z.string().nullable().optional()
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

// Input schema for updating mood entries
export const updateMoodEntryInputSchema = z.object({
  id: z.number(),
  mood_score: z.number().int().min(1).max(5).optional(),
  note: z.string().nullable().optional()
});

export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntryInputSchema>;

// Daily entry schema (combines tasks and mood for a specific date)
export const dailyEntrySchema = z.object({
  date: z.coerce.date(),
  tasks: z.array(taskSchema),
  mood_entry: moodEntrySchema.nullable()
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;

// Input schema for getting daily entries
export const getDailyEntryInputSchema = z.object({
  date: z.string() // ISO date string (YYYY-MM-DD)
});

export type GetDailyEntryInput = z.infer<typeof getDailyEntryInputSchema>;

// Input schema for getting historical entries
export const getHistoricalEntriesInputSchema = z.object({
  start_date: z.string().optional(), // ISO date string (YYYY-MM-DD)
  end_date: z.string().optional(), // ISO date string (YYYY-MM-DD)
  limit: z.number().int().positive().max(100).optional() // Limit results to prevent performance issues
});

export type GetHistoricalEntriesInput = z.infer<typeof getHistoricalEntriesInputSchema>;

// Delete input schemas
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

export const deleteMoodEntryInputSchema = z.object({
  id: z.number()
});

export type DeleteMoodEntryInput = z.infer<typeof deleteMoodEntryInputSchema>;
