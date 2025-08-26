import { z } from 'zod';

// Event schema representing the event entity as stored in the database
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field, not optional (can be explicitly null)
  event_date: z.coerce.date(), // Stored as timestamp in DB, coerced to Date
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating a new event
export const createEventInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(), // Can be null, undefined not allowed
  event_date: z.coerce.date()
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for deleting an event (by id)
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
