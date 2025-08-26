import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteEventInput = {
  id: 1
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event', async () => {
    // First create an event to delete
    const [createdEvent] = await db.insert(eventsTable)
      .values({
        title: 'Event to Delete',
        description: 'This event will be deleted',
        date: '2024-01-15'
      })
      .returning()
      .execute();

    // Delete the event
    const result = await deleteEvent({ id: createdEvent.id });

    // Verify success response
    expect(result.success).toBe(true);

    // Verify the event was actually deleted from database
    const deletedEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(deletedEvent).toHaveLength(0);
  });

  it('should throw error when event does not exist', async () => {
    // Try to delete a non-existent event
    await expect(deleteEvent({ id: 999 }))
      .rejects
      .toThrow(/Event with id 999 not found/i);
  });

  it('should delete event with null description', async () => {
    // Create an event with null description
    const [createdEvent] = await db.insert(eventsTable)
      .values({
        title: 'Event with null description',
        description: null,
        date: '2024-02-01'
      })
      .returning()
      .execute();

    // Delete the event
    const result = await deleteEvent({ id: createdEvent.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify deletion
    const deletedEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(deletedEvent).toHaveLength(0);
  });

  it('should only delete the specified event', async () => {
    // Create multiple events
    const [event1] = await db.insert(eventsTable)
      .values({
        title: 'Event 1',
        description: 'First event',
        date: '2024-01-15'
      })
      .returning()
      .execute();

    const [event2] = await db.insert(eventsTable)
      .values({
        title: 'Event 2',
        description: 'Second event',
        date: '2024-01-16'
      })
      .returning()
      .execute();

    // Delete only the first event
    const result = await deleteEvent({ id: event1.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify only the first event was deleted
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(1);
    expect(remainingEvents[0].id).toEqual(event2.id);
    expect(remainingEvents[0].title).toEqual('Event 2');
  });

  it('should handle deletion of event with future date', async () => {
    // Create an event with future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const [createdEvent] = await db.insert(eventsTable)
      .values({
        title: 'Future Event',
        description: 'An event in the future',
        date: futureDateStr
      })
      .returning()
      .execute();

    // Delete the future event
    const result = await deleteEvent({ id: createdEvent.id });

    // Verify success
    expect(result.success).toBe(true);

    // Verify deletion
    const deletedEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(deletedEvent).toHaveLength(0);
  });
});
