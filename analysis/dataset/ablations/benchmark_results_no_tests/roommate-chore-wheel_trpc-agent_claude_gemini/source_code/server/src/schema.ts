import { z } from 'zod';

// Chore schema with proper type handling
export const choreSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_completed: z.boolean(),
  assigned_date: z.coerce.date(), // Automatically converts string timestamps to Date objects
  created_at: z.coerce.date()
});

export type Chore = z.infer<typeof choreSchema>;

// Input schema for creating chores
export const createChoreInputSchema = z.object({
  name: z.string().min(1, "Chore name cannot be empty"),
});

export type CreateChoreInput = z.infer<typeof createChoreInputSchema>;

// Input schema for updating chore completion status
export const updateChoreCompletionSchema = z.object({
  id: z.number(),
  is_completed: z.boolean()
});

export type UpdateChoreCompletionInput = z.infer<typeof updateChoreCompletionSchema>;

// Schema for weekly chore assignment
export const assignWeeklyChoresSchema = z.object({
  week_start_date: z.coerce.date()
});

export type AssignWeeklyChoresInput = z.infer<typeof assignWeeklyChoresSchema>;
