import { z } from 'zod';

// Timer settings schema
export const timerSettingsSchema = z.object({
  workDuration: z.number().int().positive(), // in milliseconds
  breakDuration: z.number().int().positive(), // in milliseconds
});

export type TimerSettings = z.infer<typeof timerSettingsSchema>;

// Timer state schema
export const timerStateSchema = z.object({
  isRunning: z.boolean(),
  isWorkSession: z.boolean(),
  timeRemaining: z.number().int().nonnegative(), // in milliseconds
  currentSessionId: z.string().nullable(), // UUID for the current session
});

export type TimerState = z.infer<typeof timerStateSchema>;

// Pomodoro session schema
export const pomodoroSessionSchema = z.object({
  id: z.string(), // UUID
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  isWorkSession: z.boolean(),
  completed: z.boolean(),
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;

// Pomodoro log entry schema
export const pomodoroLogSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  workSessionsCompleted: z.number().int().nonnegative(),
  breakSessionsCompleted: z.number().int().nonnegative(),
});

export type PomodoroLog = z.infer<typeof pomodoroLogSchema>;

// Input schemas
export const updateTimerSettingsInputSchema = z.object({
  workDuration: z.number().int().positive().optional(),
  breakDuration: z.number().int().positive().optional(),
});

export type UpdateTimerSettingsInput = z.infer<typeof updateTimerSettingsInputSchema>;

export const startTimerInputSchema = z.object({
  isWorkSession: z.boolean(),
});

export type StartTimerInput = z.infer<typeof startTimerInputSchema>;