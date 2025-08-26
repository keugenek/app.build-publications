import { z } from 'zod';

// Mood enum for mood tracking
export const moodEnum = z.enum(['very_sad', 'sad', 'neutral', 'happy', 'very_happy']);
export type Mood = z.infer<typeof moodEnum>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  daily_entry_id: z.number()
});

export type Task = z.infer<typeof taskSchema>;

// Daily entry schema
export const dailyEntrySchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  mood: moodEnum.nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  daily_entry_id: z.number()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for creating daily entries
export const createDailyEntryInputSchema = z.object({
  date: z.coerce.date(),
  mood: moodEnum.nullable(),
  notes: z.string().nullable()
});

export type CreateDailyEntryInput = z.infer<typeof createDailyEntryInputSchema>;

// Input schema for updating daily entries
export const updateDailyEntryInputSchema = z.object({
  id: z.number(),
  mood: moodEnum.nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateDailyEntryInput = z.infer<typeof updateDailyEntryInputSchema>;

// Schema for getting daily entries with date range
export const getDailyEntriesInputSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type GetDailyEntriesInput = z.infer<typeof getDailyEntriesInputSchema>;

// Schema for complete daily entry view with tasks
export const dailyEntryWithTasksSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  mood: moodEnum.nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  tasks: z.array(taskSchema)
});

export type DailyEntryWithTasks = z.infer<typeof dailyEntryWithTasksSchema>;
