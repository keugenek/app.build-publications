import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type Event } from '../schema';

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    // Insert event record - convert Date to string for database
    const result = await db.insert(eventsTable)
      .values({
        title: input.title,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        description: input.description
      })
      .returning()
      .execute();

    // Return the created event with date converted back to Date object
    const event = result[0];
    return {
      ...event,
      date: new Date(event.date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
