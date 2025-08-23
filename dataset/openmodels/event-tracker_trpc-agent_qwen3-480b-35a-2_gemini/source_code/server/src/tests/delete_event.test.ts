import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event', async () => {
    // First create an event to delete
    const testEvent = {
      title: 'Test Event',
      date: '2023-12-25', // Date needs to be a string for the database
      description: 'A test event for deletion'
    };

    const createdEvent = await db.insert(eventsTable)
      .values(testEvent)
      .returning()
      .execute()
      .then(results => results[0]);

    // Delete the event
    const deleteInput: DeleteEventInput = {
      id: createdEvent.id
    };

    await expect(deleteEvent(deleteInput)).resolves.toBeUndefined();

    // Verify event no longer exists
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, deleteInput.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should not throw when trying to delete a non-existent event', async () => {
    // Try to delete an event that doesn't exist
    const deleteInput: DeleteEventInput = {
      id: 99999 // Non-existent ID
    };

    // Should not throw an error when deleting non-existent event
    await expect(deleteEvent(deleteInput)).resolves.toBeUndefined();
  });
});
