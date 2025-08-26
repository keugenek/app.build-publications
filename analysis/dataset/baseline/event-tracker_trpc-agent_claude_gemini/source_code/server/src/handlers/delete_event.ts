import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<boolean> => {
  try {
    // Delete the event record by ID
    const result = await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();

    // Return true if a row was deleted, false if no matching event was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
