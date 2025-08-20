import { type DeleteEventInput, type Event } from '../schema';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Delete an event from the database and return the deleted record.
export const deleteEvent = async (input: DeleteEventInput): Promise<Event> => {
  try {
    // Attempt to delete the event and return the deleted row
    const deleted = await db
      .delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    if (deleted.length === 0) {
      // No rows deleted – event not found
      throw new Error(`Event with id ${input.id} not found`);
    }

    const event = deleted[0];
    // Convert date string (from pg date column) to Date object for the schema type
    return {
      ...event,
      // "date" column is stored as a string in yyyy-mm-dd format; coerce to Date
      date: new Date(event.date as unknown as string)
    } as Event;
  } catch (error) {
    console.error('Delete event failed:', error);
    throw error;
  }
}; 
