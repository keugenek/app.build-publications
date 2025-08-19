import { z } from 'zod';

// Session type enum
export const sessionTypeEnum = z.enum(['work', 'break']);
export type SessionType = z.infer<typeof sessionTypeEnum>;

// Session schema with proper type handling
export const sessionSchema = z.object({
  id: z.number(),
  type: sessionTypeEnum,
  duration: z.number().int().positive(), // Duration in minutes
  completed_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type Session = z.infer<typeof sessionSchema>;

// Input schema for creating sessions
export const createSessionInputSchema = z.object({
  type: sessionTypeEnum,
  duration: z.number().int().positive().max(120) // Max 2 hours per session
});

export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;

// Input schema for timer settings
export const timerSettingsSchema = z.object({
  workDuration: z.number().int().positive().min(1).max(120), // 1-120 minutes
  breakDuration: z.number().int().positive().min(1).max(60) // 1-60 minutes
});

export type TimerSettings = z.infer<typeof timerSettingsSchema>;
