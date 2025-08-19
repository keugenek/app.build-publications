import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type Event } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEvent = async (input: UpdateEventInput): Promise<Event | null> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof eventsTable.$inferInsert> = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the event and return the updated record
    const result = await db.update(eventsTable)
      .set(updateData)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no event was found and updated
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Event update failed:', error);
    throw error;
  }
};
