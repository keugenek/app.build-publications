import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  name: z.string()
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type Chore = z.infer<typeof choreSchema>;

export const createChoreInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable()
});
export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Assignment schema
export const assignmentSchema = z.object({
  id: z.number(),
  chore_id: z.number(),
  user_id: z.number(),
  week_start: z.coerce.date(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const markAssignmentCompleteInputSchema = z.object({
  id: z.number(),
  completed: z.boolean()
});
export type MarkAssignmentCompleteInput = z.infer<typeof markAssignmentCompleteInputSchema>;

export const assignWeeklyInputSchema = z.object({
  week_start: z.coerce.date()
});
export type AssignWeeklyInput = z.infer<typeof assignWeeklyInputSchema>;
