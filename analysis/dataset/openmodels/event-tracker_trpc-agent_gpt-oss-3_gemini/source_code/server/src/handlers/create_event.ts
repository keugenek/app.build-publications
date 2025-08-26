import { type CreateEventInput, type Event } from '../schema';

/**
 * Placeholder handler for creating a new event.
 * In a real implementation this would persist the event to the database.
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  // Return a mock event with generated fields
  return {
    id: Date.now(), // mock ID
    title: input.title,
    description: input.description,
    date: input.date,
    created_at: new Date(),
  } as Event;
}
