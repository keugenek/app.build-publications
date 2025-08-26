import { z } from 'zod';

// Event schema with proper date handling
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(), // Automatically converts string dates to Date objects
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating events
export const createEventInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  date: z.coerce.date()
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for deleting events
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;
