import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<void> => {
  try {
    await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
