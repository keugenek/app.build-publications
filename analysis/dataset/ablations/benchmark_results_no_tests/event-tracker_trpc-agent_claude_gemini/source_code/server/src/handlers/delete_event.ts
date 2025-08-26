import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteEvent = async (input: DeleteEventInput): Promise<{ success: boolean }> => {
  try {
    // Delete the event by ID
    const result = await db.delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were affected (event existed and was deleted)
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
};
