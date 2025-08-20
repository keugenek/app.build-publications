import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type Event } from '../schema';

export const getEvents = async (): Promise<Event[]> => {
  try {
    const results = await db.select()
      .from(eventsTable)
      .orderBy(eventsTable.date)
      .execute();

    // Convert timestamp strings back to the format expected by the schema
    return results.map(event => ({
      ...event,
      date: event.date.toISOString(),
      created_at: event.created_at.toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
