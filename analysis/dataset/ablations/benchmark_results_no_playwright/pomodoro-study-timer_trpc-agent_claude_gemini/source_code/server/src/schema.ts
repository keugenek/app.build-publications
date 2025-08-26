import { z } from 'zod';

// Timer settings schema
export const timerSettingsSchema = z.object({
  id: z.number(),
  work_duration: z.number().int().positive(), // in minutes
  break_duration: z.number().int().positive(), // in minutes
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimerSettings = z.infer<typeof timerSettingsSchema>;

// Input schema for updating timer settings
export const updateTimerSettingsInputSchema = z.object({
  work_duration: z.number().int().positive().optional(),
  break_duration: z.number().int().positive().optional()
});

export type UpdateTimerSettingsInput = z.infer<typeof updateTimerSettingsInputSchema>;

// Study session schema for tracking completed sessions
export const studySessionSchema = z.object({
  id: z.number(),
  date: z.string(), // YYYY-MM-DD format for daily tracking
  completed_sessions: z.number().int().nonnegative(), // number of completed work sessions
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StudySession = z.infer<typeof studySessionSchema>;

// Input schema for logging a completed session
export const logSessionInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format validation
});

export type LogSessionInput = z.infer<typeof logSessionInputSchema>;
