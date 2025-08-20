import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';
import { asc } from 'drizzle-orm';

export const getEvents = async (): Promise<Event[]> => {
  try {
    // Query all events ordered by date (ascending)
    const results = await db.select()
      .from(eventsTable)
      .orderBy(asc(eventsTable.date))
      .execute();

    // Convert results to match Event schema with proper date handling
    return results.map(event => ({
      ...event,
      date: new Date(event.date), // Ensure date field is a Date object
      created_at: event.created_at // This is already a Date from timestamp column
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
