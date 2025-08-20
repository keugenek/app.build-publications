import { z } from 'zod';

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// Weekly Assignment schema
export const weeklyAssignmentSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  chore_id: z.number(),
  week_start_date: z.coerce.date(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable()
});

export type WeeklyAssignment = z.infer<typeof weeklyAssignmentSchema>;

// Combined Assignment schema (for API response with joined data)
export const assignmentSchema = z.object({
  id: z.number(),
  member: memberSchema,
  chore: choreSchema,
  week_start_date: z.coerce.date(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable()
});

export type Assignment = z.infer<typeof assignmentSchema>;

// Input schema for creating members
export const createMemberInputSchema = z.object({
  name: z.string().min(1, "Name is required")
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable()
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schema for updating assignments
export const updateAssignmentInputSchema = z.object({
  id: z.number(),
  is_completed: z.boolean()
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentInputSchema>;
