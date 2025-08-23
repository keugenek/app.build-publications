import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  completed: z.boolean().optional().default(false)
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Mood schema
export const moodSchema = z.object({
  id: z.number(),
  mood: z.number().int().min(1).max(5),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Mood = z.infer<typeof moodSchema>;

// Input schema for logging mood
export const logMoodInputSchema = z.object({
  mood: z.number().int().min(1).max(5),
  description: z.string().nullable().optional()
});

export type LogMoodInput = z.infer<typeof logMoodInputSchema>;

// Journal entry schema (combining tasks and mood for history view)
export const journalEntrySchema = z.object({
  date: z.coerce.date(),
  tasks: z.array(taskSchema),
  mood: moodSchema.nullable()
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;
