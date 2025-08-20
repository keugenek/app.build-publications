import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Helper function to create an event for testing
const createEvent = async (input: CreateEventInput) => {
  const result = await db.insert(eventsTable)
    .values({
      title: input.title,
      date: new Date(input.date),
      description: input.description
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    date: result[0].date.toISOString(),
    created_at: result[0].created_at.toISOString()
  };
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event', async () => {
    // First create an event to delete
    const testEvent = await createEvent({
      title: 'Test Event',
      date: new Date().toISOString(),
      description: 'A event for testing'
    });

    // Delete the event
    const deleteInput: DeleteEventInput = { id: testEvent.id };
    const result = await deleteEvent(deleteInput);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify event no longer exists in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, testEvent.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent event', async () => {
    const deleteInput: DeleteEventInput = { id: 99999 }; // Non-existent ID
    const result = await deleteEvent(deleteInput);

    expect(result).toBe(false);
  });
});
