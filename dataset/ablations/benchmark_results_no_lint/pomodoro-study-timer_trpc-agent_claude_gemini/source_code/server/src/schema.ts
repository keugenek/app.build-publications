import { z } from 'zod';

// Timer session schema
export const timerSessionSchema = z.object({
  id: z.number(),
  session_type: z.enum(['work', 'break']),
  duration_minutes: z.number().int().positive(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type TimerSession = z.infer<typeof timerSessionSchema>;

// Input schema for creating a timer session
export const createTimerSessionInputSchema = z.object({
  session_type: z.enum(['work', 'break']),
  duration_minutes: z.number().int().positive()
});

export type CreateTimerSessionInput = z.infer<typeof createTimerSessionInputSchema>;

// Timer settings schema
export const timerSettingsSchema = z.object({
  id: z.number(),
  work_duration_minutes: z.number().int().positive(),
  break_duration_minutes: z.number().int().positive(),
  audio_enabled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimerSettings = z.infer<typeof timerSettingsSchema>;

// Input schema for updating timer settings
export const updateTimerSettingsInputSchema = z.object({
  work_duration_minutes: z.number().int().positive().optional(),
  break_duration_minutes: z.number().int().positive().optional(),
  audio_enabled: z.boolean().optional()
});

export type UpdateTimerSettingsInput = z.infer<typeof updateTimerSettingsInputSchema>;

// Session log schema for daily summary
export const sessionLogSchema = z.object({
  date: z.string(), // YYYY-MM-DD format
  work_sessions_count: z.number().int().nonnegative(),
  break_sessions_count: z.number().int().nonnegative(),
  total_work_minutes: z.number().nonnegative(),
  total_break_minutes: z.number().nonnegative()
});

export type SessionLog = z.infer<typeof sessionLogSchema>;

// Input schema for querying session logs by date range
export const getSessionLogsInputSchema = z.object({
  start_date: z.string().optional(), // YYYY-MM-DD format
  end_date: z.string().optional() // YYYY-MM-DD format
});

export type GetSessionLogsInput = z.infer<typeof getSessionLogsInputSchema>;
