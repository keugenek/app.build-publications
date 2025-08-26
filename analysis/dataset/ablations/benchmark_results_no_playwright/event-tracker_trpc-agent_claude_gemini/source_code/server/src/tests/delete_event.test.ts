import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Test input for deleting an event
const testDeleteInput: DeleteEventInput = {
  id: 1
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event', async () => {
    // First create an event to delete
    const insertResult = await db.insert(eventsTable)
      .values({
        title: 'Test Event',
        description: 'An event for testing deletion',
        date: '2024-12-25'
      })
      .returning()
      .execute();

    const createdEvent = insertResult[0];

    // Delete the event
    const result = await deleteEvent({ id: createdEvent.id });

    // Verify the result indicates success
    expect(result.success).toBe(true);

    // Verify the event no longer exists in the database
    const remainingEvents = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(remainingEvents).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent event', async () => {
    // Try to delete an event that doesn't exist
    const result = await deleteEvent({ id: 999 });

    // Verify the result indicates failure
    expect(result.success).toBe(false);
  });

  it('should not affect other events when deleting one event', async () => {
    // Create multiple events
    const events = await db.insert(eventsTable)
      .values([
        {
          title: 'Event 1',
          description: 'First event',
          date: '2024-12-20'
        },
        {
          title: 'Event 2', 
          description: 'Second event',
          date: '2024-12-21'
        },
        {
          title: 'Event 3',
          description: 'Third event', 
          date: '2024-12-22'
        }
      ])
      .returning()
      .execute();

    // Delete the middle event
    const eventToDelete = events[1];
    const result = await deleteEvent({ id: eventToDelete.id });

    // Verify deletion succeeded
    expect(result.success).toBe(true);

    // Verify only the targeted event was deleted
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(2);
    
    // Verify the correct events remain
    const remainingIds = remainingEvents.map(event => event.id);
    expect(remainingIds).toContain(events[0].id);
    expect(remainingIds).toContain(events[2].id);
    expect(remainingIds).not.toContain(eventToDelete.id);
  });

  it('should handle deletion with various event data types', async () => {
    // Create an event with different field values
    const eventResult = await db.insert(eventsTable)
      .values({
        title: 'Special Event with Unicode 🎉',
        description: 'Event with special characters & symbols: @#$%^&*()',
        date: '2024-01-01'
      })
      .returning()
      .execute();

    const createdEvent = eventResult[0];

    // Delete the event
    const result = await deleteEvent({ id: createdEvent.id });

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify event is gone
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should work correctly with zero ID', async () => {
    // Test edge case with ID 0 (shouldn't exist but test anyway)
    const result = await deleteEvent({ id: 0 });

    // Should return false since event doesn't exist
    expect(result.success).toBe(false);
  });

  it('should work correctly with negative ID', async () => {
    // Test edge case with negative ID
    const result = await deleteEvent({ id: -1 });

    // Should return false since event doesn't exist
    expect(result.success).toBe(false);
  });
});
