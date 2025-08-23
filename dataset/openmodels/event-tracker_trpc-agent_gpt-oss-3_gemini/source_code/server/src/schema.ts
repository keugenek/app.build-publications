import { z } from 'zod';

// Event schema representing the Event entity as stored in the database
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(), // Coerces ISO string to Date
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating a new event
export const createEventInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date()
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for deleting an event by id
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
