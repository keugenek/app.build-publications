import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteEventInput } from '../schema';

/**
 * Deletes an event by its ID.
 * Returns { success: true } if a row was deleted, otherwise { success: false }.
 */
export async function deleteEvent(input: DeleteEventInput): Promise<{ success: boolean }> {
  try {
    const result = await db
      .delete(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Event deletion failed:', error);
    throw error;
  }
}
