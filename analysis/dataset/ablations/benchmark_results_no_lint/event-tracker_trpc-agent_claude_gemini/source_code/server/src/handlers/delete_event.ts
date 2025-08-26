import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<{ success: boolean }> => {
  try {
    // First check if the event exists
    const existingEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();

    if (existingEvent.length === 0) {
      throw new Error(`Event with id ${input.id} not found`);
    }

    // Delete the event
    const result = await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
