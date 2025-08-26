import { z } from 'zod';

// Event schema with proper date handling
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  date: z.coerce.date(), // Automatically converts string dates to Date objects
  description: z.string().nullable(), // Nullable field for optional descriptions
  created_at: z.coerce.date() // Timestamp when event was created
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating events
export const createEventInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.coerce.date(),
  description: z.string().nullable() // Explicit null allowed
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for updating events
export const updateEventInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  date: z.coerce.date().optional(),
  description: z.string().nullable().optional()
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

// Input schema for deleting events
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
