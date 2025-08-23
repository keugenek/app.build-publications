import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';

export const getEvents = async (): Promise<Event[]> => {
  try {
    const results = await db.select()
      .from(eventsTable)
      .orderBy(eventsTable.date)
      .execute();

    // Convert date strings back to Date objects before returning
    return results.map(event => ({
      ...event,
      date: new Date(event.date),
      created_at: new Date(event.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
