import { z } from 'zod';

// Pomodoro settings schema
export const pomodoroSettingsSchema = z.object({
  id: z.number(),
  workDuration: z.number().int().positive(), // in seconds
  shortBreakDuration: z.number().int().positive(), // in seconds
  longBreakDuration: z.number().int().positive(), // in seconds
  longBreakInterval: z.number().int().positive(), // after how many pomodoros
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PomodoroSettings = z.infer<typeof pomodoroSettingsSchema>;

// Input schema for creating/updating Pomodoro settings
export const createPomodoroSettingsInputSchema = z.object({
  workDuration: z.number().int().positive(),
  shortBreakDuration: z.number().int().positive(),
  longBreakDuration: z.number().int().positive(),
  longBreakInterval: z.number().int().positive(),
});

export type CreatePomodoroSettingsInput = z.infer<typeof createPomodoroSettingsInputSchema>;

export const updatePomodoroSettingsInputSchema = z.object({
  id: z.number(),
  workDuration: z.number().int().positive().optional(),
  shortBreakDuration: z.number().int().positive().optional(),
  longBreakDuration: z.number().int().positive().optional(),
  longBreakInterval: z.number().int().positive().optional(),
});

export type UpdatePomodoroSettingsInput = z.infer<typeof updatePomodoroSettingsInputSchema>;

// Pomodoro session schema
export const pomodoroSessionSchema = z.object({
  id: z.number(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isWorkSession: z.number(), // 1 for work, 0 for break
  created_at: z.coerce.date(),
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;

// Input schema for creating Pomodoro sessions
export const createPomodoroSessionInputSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isWorkSession: z.number(), // 1 for work, 0 for break
});

export type CreatePomodoroSessionInput = z.infer<typeof createPomodoroSessionInputSchema>;

// Timer state schema
export const timerStateSchema = z.object({
  isRunning: z.boolean(),
  currentTime: z.number(), // in seconds
  currentMode: z.enum(['work', 'shortBreak', 'longBreak']),
  pomodorosCompleted: z.number(),
});

export type TimerState = z.infer<typeof timerStateSchema>;
