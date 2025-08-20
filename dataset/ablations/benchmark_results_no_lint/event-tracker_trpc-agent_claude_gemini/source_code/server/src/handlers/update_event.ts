import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type Event } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEvent = async (input: UpdateEventInput): Promise<Event> => {
  try {
    // First, verify the event exists
    const existingEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, input.id))
      .execute();

    if (existingEvent.length === 0) {
      throw new Error(`Event with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: Partial<typeof eventsTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string for date column
    }

    // Perform the update
    const result = await db.update(eventsTable)
      .set(updateData)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    // Convert the date string back to Date object for the response
    const updatedEvent = result[0];
    return {
      ...updatedEvent,
      date: new Date(updatedEvent.date), // Convert string back to Date
      created_at: updatedEvent.created_at // This is already a Date from timestamp column
    };
  } catch (error) {
    console.error('Event update failed:', error);
    throw error;
  }
};
