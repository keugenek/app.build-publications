import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type Event } from '../schema';

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    // Insert event record
    const result = await db.insert(eventsTable)
      .values({
        title: input.title,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        description: input.description
      })
      .returning()
      .execute();

    // Convert the date string back to a Date object
    return {
      ...result[0],
      date: new Date(result[0].date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
