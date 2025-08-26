import { z } from 'zod';

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Weekly assignment schema
export const weeklyAssignmentSchema = z.object({
  id: z.number(),
  week_start_date: z.coerce.date(),
  chore_id: z.number(),
  user_id: z.number(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type WeeklyAssignment = z.infer<typeof weeklyAssignmentSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable()
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for assigning chores
export const assignChoresInputSchema = z.object({
  week_start_date: z.coerce.date(),
  assignments: z.array(z.object({
    chore_id: z.number(),
    user_id: z.number()
  }))
});

export type AssignChoresInput = z.infer<typeof assignChoresInputSchema>;

// Input schema for updating assignment completion
export const updateAssignmentCompletionInputSchema = z.object({
  assignment_id: z.number(),
  is_completed: z.boolean()
});

export type UpdateAssignmentCompletionInput = z.infer<typeof updateAssignmentCompletionInputSchema>;

// Output schema for current week assignments
export const currentWeekAssignmentSchema = z.object({
  assignment_id: z.number(),
  week_start_date: z.coerce.date(),
  chore_name: z.string(),
  chore_description: z.string().nullable(),
  user_name: z.string(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable()
});

export type CurrentWeekAssignment = z.infer<typeof currentWeekAssignmentSchema>;
