import { z } from 'zod';

// Pomodoro settings schema (single row configuration)
export const pomodoroSettingsSchema = z.object({
  id: z.number(),
  work_minutes: z.number().int().positive(),
  break_minutes: z.number().int().positive(),
  created_at: z.coerce.date(),
});

export type PomodoroSettings = z.infer<typeof pomodoroSettingsSchema>;

// Input schema for updating settings (both fields optional)
export const updatePomodoroSettingsInputSchema = z.object({
  work_minutes: z.number().int().positive().optional(),
  break_minutes: z.number().int().positive().optional(),
});

export type UpdatePomodoroSettingsInput = z.infer<typeof updatePomodoroSettingsInputSchema>;

// Pomodoro daily log schema
export const pomodoroLogSchema = z.object({
  id: z.number(),
  date: z.string(), // Date stored as string (YYYY-MM-DD) in DB
  sessions_completed: z.number().int().nonnegative(),
});

export type PomodoroLog = z.infer<typeof pomodoroLogSchema>;

// Input schema for incrementing sessions (date optional, defaults to today)
export const incrementSessionInputSchema = z.object({
  date: z.string().optional(),
});

export type IncrementSessionInput = z.infer<typeof incrementSessionInputSchema>;
