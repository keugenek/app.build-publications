import { z } from 'zod';

// Pomodoro session schema
export const pomodoroSessionSchema = z.object({
  id: z.number(),
  work_duration: z.number().int().positive(), // Duration in minutes
  short_break_duration: z.number().int().positive(), // Duration in minutes
  long_break_duration: z.number().int().positive(), // Duration in minutes
  long_break_interval: z.number().int().positive(), // After how many pomodoros
  completed_pomodoros: z.number().int().nonnegative(), // Number of completed pomodoros in session
  is_active: z.boolean(),
  current_phase: z.enum(['work', 'short_break', 'long_break', 'idle']),
  phase_start_time: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;

// Pomodoro log entry schema
export const pomodoroLogSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  phase_type: z.enum(['work', 'short_break', 'long_break']),
  duration_minutes: z.number().int().positive(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  was_interrupted: z.boolean()
});

export type PomodoroLog = z.infer<typeof pomodoroLogSchema>;

// Input schema for creating a new pomodoro session
export const createPomodoroSessionInputSchema = z.object({
  work_duration: z.number().int().positive().default(25), // Default 25 minutes
  short_break_duration: z.number().int().positive().default(5), // Default 5 minutes
  long_break_duration: z.number().int().positive().default(15), // Default 15 minutes
  long_break_interval: z.number().int().positive().default(4) // Default every 4 pomodoros
});

export type CreatePomodoroSessionInput = z.infer<typeof createPomodoroSessionInputSchema>;

// Input schema for updating session settings
export const updatePomodoroSessionInputSchema = z.object({
  id: z.number(),
  work_duration: z.number().int().positive().optional(),
  short_break_duration: z.number().int().positive().optional(),
  long_break_duration: z.number().int().positive().optional(),
  long_break_interval: z.number().int().positive().optional()
});

export type UpdatePomodoroSessionInput = z.infer<typeof updatePomodoroSessionInputSchema>;

// Input schema for starting a phase (work or break)
export const startPhaseInputSchema = z.object({
  session_id: z.number(),
  phase_type: z.enum(['work', 'short_break', 'long_break'])
});

export type StartPhaseInput = z.infer<typeof startPhaseInputSchema>;

// Input schema for completing a phase
export const completePhaseInputSchema = z.object({
  session_id: z.number(),
  was_interrupted: z.boolean().default(false)
});

export type CompletePhaseInput = z.infer<typeof completePhaseInputSchema>;

// Schema for getting session statistics
export const sessionStatsSchema = z.object({
  session_id: z.number(),
  total_completed_pomodoros: z.number().int(),
  total_work_time: z.number().int(), // in minutes
  total_break_time: z.number().int(), // in minutes
  completion_rate: z.number(), // percentage of non-interrupted sessions
  last_activity: z.coerce.date().nullable()
});

export type SessionStats = z.infer<typeof sessionStatsSchema>;

// Input schema for getting daily logs
export const getDailyLogsInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
});

export type GetDailyLogsInput = z.infer<typeof getDailyLogsInputSchema>;
