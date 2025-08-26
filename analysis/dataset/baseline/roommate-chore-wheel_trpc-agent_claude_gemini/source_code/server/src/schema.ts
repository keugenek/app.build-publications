import { z } from 'zod';

// Participant schema
export const participantSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Participant = z.infer<typeof participantSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// Week schema
export const weekSchema = z.object({
  id: z.number(),
  year: z.number().int(),
  week_number: z.number().int().min(1).max(53),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Week = z.infer<typeof weekSchema>;

// Assignment schema
export const assignmentSchema = z.object({
  id: z.number(),
  week_id: z.number(),
  participant_id: z.number(),
  chore_id: z.number(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Assignment = z.infer<typeof assignmentSchema>;

// Input schemas for creating participants
export const createParticipantInputSchema = z.object({
  name: z.string().min(1, "Name is required")
});

export type CreateParticipantInput = z.infer<typeof createParticipantInputSchema>;

// Input schemas for creating chores
export const createChoreInputSchema = z.object({
  name: z.string().min(1, "Name is required")
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schemas for updating participants
export const updateParticipantInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional()
});

export type UpdateParticipantInput = z.infer<typeof updateParticipantInputSchema>;

// Input schemas for updating chores
export const updateChoreInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional()
});

export type UpdateChoreInput = z.infer<typeof updateChoreInputSchema>;

// Input schema for creating weekly assignments
export const createWeeklyAssignmentInputSchema = z.object({
  year: z.number().int(),
  week_number: z.number().int().min(1).max(53)
});

export type CreateWeeklyAssignmentInput = z.infer<typeof createWeeklyAssignmentInputSchema>;

// Input schema for marking assignment as complete
export const completeAssignmentInputSchema = z.object({
  assignment_id: z.number()
});

export type CompleteAssignmentInput = z.infer<typeof completeAssignmentInputSchema>;

// Input schema for getting assignments by week
export const getAssignmentsByWeekInputSchema = z.object({
  year: z.number().int(),
  week_number: z.number().int().min(1).max(53)
});

export type GetAssignmentsByWeekInput = z.infer<typeof getAssignmentsByWeekInputSchema>;

// Input schema for getting assignments by participant
export const getAssignmentsByParticipantInputSchema = z.object({
  participant_id: z.number(),
  year: z.number().int().optional(),
  week_number: z.number().int().min(1).max(53).optional()
});

export type GetAssignmentsByParticipantInput = z.infer<typeof getAssignmentsByParticipantInputSchema>;

// Delete input schemas
export const deleteParticipantInputSchema = z.object({
  id: z.number()
});

export type DeleteParticipantInput = z.infer<typeof deleteParticipantInputSchema>;

export const deleteChoreInputSchema = z.object({
  id: z.number()
});

export type DeleteChoreInput = z.infer<typeof deleteChoreInputSchema>;

// Combined assignment with related data for UI
export const assignmentWithDetailsSchema = z.object({
  id: z.number(),
  week: weekSchema,
  participant: participantSchema,
  chore: choreSchema,
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type AssignmentWithDetails = z.infer<typeof assignmentWithDetailsSchema>;
