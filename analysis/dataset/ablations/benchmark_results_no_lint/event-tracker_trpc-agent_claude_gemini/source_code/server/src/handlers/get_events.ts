import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';
import { desc } from 'drizzle-orm';

export const getEvents = async (): Promise<Event[]> => {
  try {
    // Query all events, ordered by date (newest first)
    const results = await db.select()
      .from(eventsTable)
      .orderBy(desc(eventsTable.date))
      .execute();

    // Convert date strings to Date objects to match Zod schema expectations
    return results.map(event => ({
      ...event,
      date: new Date(event.date) // Convert string date to Date object
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
