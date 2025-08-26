import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';

/**
 * Fetches all events from the database.
 * Returns an array of Event objects with proper Date instances.
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    const rows = await db.select().from(eventsTable).execute();
    // Drizzle returns Date objects for timestamp columns, matching our Zod schema.
    // No numeric conversion is required for this table.
    return rows;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
