import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';
import { asc } from 'drizzle-orm';

export const getEvents = async (): Promise<Event[]> => {
  try {
    // Fetch all events ordered by date (ascending)
    const events = await db.select()
      .from(eventsTable)
      .orderBy(asc(eventsTable.date))
      .execute();

    // Convert date strings to Date objects to match schema
    return events.map(event => ({
      ...event,
      date: new Date(event.date)
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
