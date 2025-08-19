import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type GetEventInput, type Event } from '../schema';
import { eq } from 'drizzle-orm';

export const getEvent = async (input: GetEventInput): Promise<Event | null> => {
  try {
    // Query for the event by ID
    const results = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();

    // Return the first result if found, otherwise null
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Event fetch failed:', error);
    throw error;
  }
};
