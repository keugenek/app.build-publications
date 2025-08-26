import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteEventInput } from '../schema';

export const deleteEvent = async (input: DeleteEventInput): Promise<boolean> => {
  try {
    const result = await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    // Return true if an event was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
