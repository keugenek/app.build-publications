import { z } from 'zod';

// Event schema for database entities
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field, can be explicitly null
  date: z.coerce.date(), // Automatically converts string timestamps to Date objects
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating events
export const createEventInputSchema = z.object({
  title: z.string().min(1, "Title is required"), // Validate non-empty title
  description: z.string().nullable(), // Explicit null allowed, undefined not allowed
  date: z.coerce.date() // Convert input string to Date object
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for updating events
export const updateEventInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(), // Optional but must be non-empty if provided
  description: z.string().nullable().optional(), // Can be null or undefined
  date: z.coerce.date().optional()
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

// Input schema for deleting events
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
