import { type DeleteEventInput, type Event } from '../schema';

// Delete an event by its ID, returning the deleted record.
// This implementation fetches the event, deletes it, and returns the original data.
// Numeric conversions are not needed for this schema, but dates are returned as Date objects by Drizzle.
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<Event> => {
  try {
    // Fetch the event to ensure it exists and to return its data after deletion
    const existing = await db.select().from(eventsTable).where(eq(eventsTable.id, input.id)).execute();
    if (existing.length === 0) {
      throw new Error(`Event with id ${input.id} not found`);
    }
    // Delete the event and return the deleted record
    const [deleted] = await db.delete(eventsTable).where(eq(eventsTable.id, input.id)).returning().execute();
    // Dates are already Date objects, no conversion needed
    return deleted as Event;
  } catch (error) {
    console.error('Failed to delete event:', error);
    throw error;
  }
};


