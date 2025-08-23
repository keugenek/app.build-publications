import { z } from 'zod';

// Pomodoro session schema representing a completed or ongoing session
export const pomodoroSessionSchema = z.object({
  id: z.number(),
  type: z.enum(['work', 'break']), // "work" or "break"
  duration_minutes: z.number().int().positive(), // duration in minutes
  started_at: z.coerce.date(), // automatically coerced from string timestamps
  ended_at: z.coerce.date().nullable(), // nullable when session is still active
  completed: z.boolean(),
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;

// Input schema for creating a pomodoro session
export const createPomodoroSessionInputSchema = z.object({
  type: z.enum(['work', 'break']),
  duration_minutes: z.number().int().positive(),
});

export type CreatePomodoroSessionInput = z.infer<typeof createPomodoroSessionInputSchema>;

// Input schema for updating a pomodoro session (e.g., marking it completed)
export const updatePomodoroSessionInputSchema = z.object({
  id: z.number(),
  ended_at: z.coerce.date().optional(),
  completed: z.boolean().optional(),
});

export type UpdatePomodoroSessionInput = z.infer<typeof updatePomodoroSessionInputSchema>;
