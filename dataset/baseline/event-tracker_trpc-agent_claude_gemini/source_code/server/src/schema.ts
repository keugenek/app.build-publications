import { z } from 'zod';

// Event schema with proper date handling
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field for optional descriptions
  date: z.coerce.date(), // Automatically converts string timestamps to Date objects
  created_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Input schema for creating events
export const createEventInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(), // Explicit null allowed for optional descriptions
  date: z.coerce.date() // Accept date strings or Date objects
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Input schema for updating events
export const updateEventInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(), // Optional = field can be undefined (omitted)
  description: z.string().nullable().optional(), // Can be null or undefined
  date: z.coerce.date().optional()
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

// Input schema for deleting events
export const deleteEventInputSchema = z.object({
  id: z.number()
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;

// Input schema for getting a single event
export const getEventInputSchema = z.object({
  id: z.number()
});

export type GetEventInput = z.infer<typeof getEventInputSchema>;
