import { z } from 'zod';

// Participant (User) schema
export const participantSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});
export type Participant = z.infer<typeof participantSchema>;

// Input schema for creating a participant
export const createParticipantInputSchema = z.object({
  name: z.string()
});
export type CreateParticipantInput = z.infer<typeof createParticipantInputSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type Chore = z.infer<typeof choreSchema>;

// Input schema for creating a chore
export const createChoreInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable()
});
export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Assignment schema (output)
export const assignmentSchema = z.object({
  id: z.number(),
  week_start: z.coerce.date(),
  chore_id: z.number(),
  participant_id: z.number(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});
export type Assignment = z.infer<typeof assignmentSchema>;

// Input schema for generating assignments for a week
export const generateAssignmentsInputSchema = z.object({
  week_start: z.coerce.date()
});
export type GenerateAssignmentsInput = z.infer<typeof generateAssignmentsInputSchema>;

// Input schema for marking an assignment as completed
export const markAssignmentCompletedInputSchema = z.object({
  assignment_id: z.number()
});
export type MarkAssignmentCompletedInput = z.infer<typeof markAssignmentCompletedInputSchema>;
