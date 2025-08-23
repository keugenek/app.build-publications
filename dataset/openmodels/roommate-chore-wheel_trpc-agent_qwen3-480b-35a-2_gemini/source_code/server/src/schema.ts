import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Chore = z.infer<typeof choreSchema>;

// Weekly chore assignment schema
export const weeklyChoreAssignmentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  chore_id: z.number(),
  week_start_date: z.coerce.date(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  assigned_at: z.coerce.date(),
});

export type WeeklyChoreAssignment = z.infer<typeof weeklyChoreAssignmentSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schema for assigning chores
export const assignChoresInputSchema = z.object({
  week_start_date: z.coerce.date(),
});

export type AssignChoresInput = z.infer<typeof assignChoresInputSchema>;

// Input schema for marking chore as complete
export const markChoreCompleteInputSchema = z.object({
  assignment_id: z.number(),
});

export type MarkChoreCompleteInput = z.infer<typeof markChoreCompleteInputSchema>;

// Schema for getting user's assigned chores
export const getUserChoresInputSchema = z.object({
  user_id: z.number(),
  week_start_date: z.coerce.date(),
});

export type GetUserChoresInput = z.infer<typeof getUserChoresInputSchema>;
