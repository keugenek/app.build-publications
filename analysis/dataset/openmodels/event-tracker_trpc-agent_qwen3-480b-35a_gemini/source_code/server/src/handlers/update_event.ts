import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type UpdateEventInput, type Event } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEvent = async (input: UpdateEventInput): Promise<Event> => {
  try {
    // Prepare update data - only include fields that are actually provided
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.date !== undefined) updateData.date = new Date(input.date);
    if (input.description !== undefined) updateData.description = input.description;

    // Update event record
    const result = await db.update(eventsTable)
      .set(updateData)
      .where(eq(eventsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Event with id ${input.id} not found`);
    }

    // Convert timestamp fields to string before returning
    const event = result[0];
    return {
      ...event,
      date: event.date.toISOString(),
      created_at: event.created_at.toISOString()
    };
  } catch (error) {
    console.error('Event update failed:', error);
    throw error;
  }
};
