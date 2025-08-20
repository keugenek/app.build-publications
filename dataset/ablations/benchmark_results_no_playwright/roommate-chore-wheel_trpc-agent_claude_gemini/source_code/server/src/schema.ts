import { z } from 'zod';

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Input schema for creating members
export const createMemberInputSchema = z.object({
  name: z.string().min(1, 'Member name is required')
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string().min(1, 'Chore name is required'),
  description: z.string().nullable()
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Assignment schema
export const assignmentSchema = z.object({
  id: z.number(),
  chore_id: z.number(),
  member_id: z.number(),
  week_start: z.coerce.date(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Assignment = z.infer<typeof assignmentSchema>;

// Assignment with related data
export const assignmentWithDetailsSchema = z.object({
  id: z.number(),
  chore_id: z.number(),
  member_id: z.number(),
  week_start: z.coerce.date(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  chore: choreSchema,
  member: memberSchema
});

export type AssignmentWithDetails = z.infer<typeof assignmentWithDetailsSchema>;

// Input schema for marking assignment as completed
export const markAssignmentCompletedInputSchema = z.object({
  assignment_id: z.number()
});

export type MarkAssignmentCompletedInput = z.infer<typeof markAssignmentCompletedInputSchema>;

// Input schema for generating weekly assignments
export const generateWeeklyAssignmentsInputSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week start must be in YYYY-MM-DD format')
});

export type GenerateWeeklyAssignmentsInput = z.infer<typeof generateWeeklyAssignmentsInputSchema>;

// Week query schema
export const weekQuerySchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week start must be in YYYY-MM-DD format').optional()
});

export type WeekQuery = z.infer<typeof weekQuerySchema>;
