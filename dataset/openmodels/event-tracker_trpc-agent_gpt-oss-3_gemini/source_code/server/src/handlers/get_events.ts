import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event as EventSchema } from '../schema';

/**
 * Fetch all events from the database.
 * Returns an array of Event objects with proper Date conversions.
 */
export async function getEvents(): Promise<EventSchema[]> {
  try {
    // Retrieve raw rows; date column is stored as a string (YYYY-MM-DD)
    const rawEvents = await db.select().from(eventsTable).execute() as any[];
    // Map to schema type, converting date strings to Date objects
    return rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: new Date(e.date as any), // e.date is a string
      created_at: new Date(e.created_at as any),
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}
