import { z } from 'zod';

// Event schema representing the event entity as stored in the database
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  date: z.coerce.date(), // Date stored as ISO string
  description: z.string().nullable(), // Nullable field, not optional (can be explicitly null)
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating a new event
export const createEventInputSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().nullable().optional() // Optional on create, can be omitted or null
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for deleting an event
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
