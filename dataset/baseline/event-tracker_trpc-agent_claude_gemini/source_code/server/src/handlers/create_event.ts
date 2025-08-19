import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type Event } from '../schema';

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    // Insert event record
    const result = await db.insert(eventsTable)
      .values({
        title: input.title,
        description: input.description,
        date: input.date
        // created_at is handled by database default (defaultNow())
      })
      .returning()
      .execute();

    // Return the created event
    const event = result[0];
    return event;
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
