import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type Event } from '../schema';

export const createEvent = async (input: CreateEventInput): Promise<Event> => {
  try {
    // Insert event record
    const result = await db.insert(eventsTable)
      .values({
        title: input.title,
        date: input.date.toISOString().split('T')[0], // Convert Date to 'YYYY-MM-DD' string
        description: input.description // Nullable field - null is valid
      })
      .returning()
      .execute();

    const event = result[0];
    return {
      ...event,
      date: new Date(event.date), // Convert string back to Date object
      created_at: new Date(event.created_at) // Ensure proper Date object
    };
  } catch (error) {
    console.error('Event creation failed:', error);
    throw error;
  }
};
