import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  name: z.string().min(1, 'Task name is required')
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating task completion status
export const updateTaskInputSchema = z.object({
  id: z.number(),
  is_completed: z.boolean()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Mood entry schema
export const moodEntrySchema = z.object({
  id: z.number(),
  mood_score: z.number().int().min(1).max(5), // 1-5 scale
  notes: z.string().nullable(), // Optional notes
  entry_date: z.coerce.date(), // Date of the mood entry
  created_at: z.coerce.date()
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for creating mood entries
export const createMoodEntryInputSchema = z.object({
  mood_score: z.number().int().min(1).max(5),
  notes: z.string().nullable().optional(), // Can be omitted or explicitly null
  entry_date: z.string() // ISO date string for specific date entry
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

// Combined daily view schema
export const dailyJournalEntrySchema = z.object({
  date: z.string(), // ISO date string
  tasks: z.array(taskSchema),
  mood_entry: moodEntrySchema.nullable() // Might not have mood entry for every day
});

export type DailyJournalEntry = z.infer<typeof dailyJournalEntrySchema>;

// Input schema for getting daily journal entries
export const getDailyJournalInputSchema = z.object({
  start_date: z.string(), // ISO date string
  end_date: z.string().optional() // If not provided, defaults to start_date
});

export type GetDailyJournalInput = z.infer<typeof getDailyJournalInputSchema>;
