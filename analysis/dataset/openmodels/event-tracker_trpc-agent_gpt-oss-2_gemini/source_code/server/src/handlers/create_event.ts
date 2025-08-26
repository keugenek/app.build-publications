import { type CreateEventInput, type Event } from '../schema';
import { db } from '../db';
import { eventsTable } from '../db/schema';

// Insert a new event record into the database and return the created event
export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    const result = await db
      .insert(eventsTable)
      .values({
        title: input.title,
        description: input.description,
        event_date: input.event_date,
      })
      .returning()
      .execute();

    const event = result[0];
    return event as Event;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error;
  }
};
