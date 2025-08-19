import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';
import { asc } from 'drizzle-orm';

export const getEvents = async (): Promise<Event[]> => {
  try {
    // Fetch all events ordered by date (ascending - chronological order)
    const results = await db.select()
      .from(eventsTable)
      .orderBy(asc(eventsTable.date))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
