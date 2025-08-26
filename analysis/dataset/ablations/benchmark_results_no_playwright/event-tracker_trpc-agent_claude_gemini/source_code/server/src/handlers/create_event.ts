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
        date: input.date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string for date column
      })
      .returning()
      .execute();

    // Return the created event with properly typed date field
    const event = result[0];
    return {
      ...event,
      date: new Date(event.date) // Convert date string back to Date object
    };
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
