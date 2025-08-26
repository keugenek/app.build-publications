import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type Event } from '../schema';

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    // Insert event record
    const result = await db.insert(eventsTable)
      .values({
        title: input.title,
        date: new Date(input.date), // Convert string to Date for database storage
        description: input.description // Nullable field - can be null
      })
      .returning()
      .execute();

    const event = result[0];
    return {
      ...event,
      date: event.date.toISOString(), // Convert Date back to string for API consistency
      created_at: event.created_at.toISOString() // Convert Date to string
    };
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
