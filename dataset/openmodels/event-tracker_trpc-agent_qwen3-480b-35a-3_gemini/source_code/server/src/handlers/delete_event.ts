import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<boolean> => {
  try {
    const result = await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .returning({ id: eventsTable.id })
      .execute();

    // If we got a result back, the event was deleted
    return result.length > 0;
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
