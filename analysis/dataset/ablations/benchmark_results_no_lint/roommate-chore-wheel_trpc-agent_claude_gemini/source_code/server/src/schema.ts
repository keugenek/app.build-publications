import { z } from 'zod';

// Chore schema for the master list of available chores
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// Weekly assignment schema for tracking assigned chores per week
export const weeklyAssignmentSchema = z.object({
  id: z.number(),
  chore_id: z.number(),
  week_start: z.coerce.date(), // Start date of the week (e.g., Monday)
  assigned_person: z.string().nullable(), // Person assigned to this chore, null if no specific person
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type WeeklyAssignment = z.infer<typeof weeklyAssignmentSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string().min(1, "Chore name is required"),
  description: z.string().nullable().optional()
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schema for updating chores
export const updateChoreInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Chore name is required").optional(),
  description: z.string().nullable().optional()
});

export type UpdateChoreInput = z.infer<typeof updateChoreInputSchema>;

// Input schema for generating weekly assignments
export const generateWeeklyAssignmentsInputSchema = z.object({
  week_start: z.coerce.date(), // The start date of the week to generate assignments for
  assigned_people: z.array(z.string()).optional() // Optional list of people to assign chores to
});

export type GenerateWeeklyAssignmentsInput = z.infer<typeof generateWeeklyAssignmentsInputSchema>;

// Input schema for marking a chore as complete
export const markChoreCompleteInputSchema = z.object({
  assignment_id: z.number()
});

export type MarkChoreCompleteInput = z.infer<typeof markChoreCompleteInputSchema>;

// Input schema for getting weekly assignments
export const getWeeklyAssignmentsInputSchema = z.object({
  week_start: z.coerce.date()
});

export type GetWeeklyAssignmentsInput = z.infer<typeof getWeeklyAssignmentsInputSchema>;

// Combined view schema for displaying chore assignments with chore details
export const choreAssignmentViewSchema = z.object({
  assignment_id: z.number(),
  chore_id: z.number(),
  chore_name: z.string(),
  chore_description: z.string().nullable(),
  week_start: z.coerce.date(),
  assigned_person: z.string().nullable(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable()
});

export type ChoreAssignmentView = z.infer<typeof choreAssignmentViewSchema>;
