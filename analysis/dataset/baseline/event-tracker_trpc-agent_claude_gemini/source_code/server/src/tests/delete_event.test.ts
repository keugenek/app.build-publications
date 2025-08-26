import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput, type CreateEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Helper function to create test events
const createTestEvent = async (eventData: CreateEventInput) => {
  const result = await db.insert(eventsTable)
    .values({
      title: eventData.title,
      description: eventData.description,
      date: eventData.date
    })
    .returning()
    .execute();

  return result[0];
};

// Test input for creating events
const testEventInput: CreateEventInput = {
  title: 'Test Event',
  description: 'A test event for deletion',
  date: new Date('2024-12-25T10:00:00Z')
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event and return true', async () => {
    // Create a test event first
    const createdEvent = await createTestEvent(testEventInput);

    const deleteInput: DeleteEventInput = {
      id: createdEvent.id
    };

    // Delete the event
    const result = await deleteEvent(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the event is actually deleted from the database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent event', async () => {
    const deleteInput: DeleteEventInput = {
      id: 999999 // Non-existent ID
    };

    // Attempt to delete non-existent event
    const result = await deleteEvent(deleteInput);

    // Should return false indicating no event was deleted
    expect(result).toBe(false);
  });

  it('should not affect other events when deleting one event', async () => {
    // Create multiple test events
    const event1 = await createTestEvent({
      title: 'Event 1',
      description: 'First event',
      date: new Date('2024-12-25T10:00:00Z')
    });

    const event2 = await createTestEvent({
      title: 'Event 2',
      description: 'Second event',
      date: new Date('2024-12-26T11:00:00Z')
    });

    const event3 = await createTestEvent({
      title: 'Event 3',
      description: null, // Test with null description
      date: new Date('2024-12-27T12:00:00Z')
    });

    // Delete only the second event
    const deleteInput: DeleteEventInput = {
      id: event2.id
    };

    const result = await deleteEvent(deleteInput);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify event2 is deleted
    const deletedEvents = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, event2.id))
      .execute();

    expect(deletedEvents).toHaveLength(0);

    // Verify other events still exist
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(2);

    // Verify specific events still exist
    const event1Exists = remainingEvents.find(e => e.id === event1.id);
    const event3Exists = remainingEvents.find(e => e.id === event3.id);

    expect(event1Exists).toBeDefined();
    expect(event1Exists?.title).toBe('Event 1');

    expect(event3Exists).toBeDefined();
    expect(event3Exists?.title).toBe('Event 3');
    expect(event3Exists?.description).toBe(null);
  });

  it('should handle deletion of events with various field values', async () => {
    // Test deleting event with null description
    const eventWithNullDesc = await createTestEvent({
      title: 'Event with null desc',
      description: null,
      date: new Date('2024-12-30T15:30:00Z')
    });

    const deleteInput: DeleteEventInput = {
      id: eventWithNullDesc.id
    };

    const result = await deleteEvent(deleteInput);

    expect(result).toBe(true);

    // Verify deletion
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventWithNullDesc.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should handle multiple sequential deletions correctly', async () => {
    // Create test events
    const event1 = await createTestEvent({
      title: 'Sequential Delete 1',
      description: 'First to delete',
      date: new Date('2024-12-25T10:00:00Z')
    });

    const event2 = await createTestEvent({
      title: 'Sequential Delete 2', 
      description: 'Second to delete',
      date: new Date('2024-12-26T11:00:00Z')
    });

    // Delete first event
    const firstDelete = await deleteEvent({ id: event1.id });
    expect(firstDelete).toBe(true);

    // Delete second event
    const secondDelete = await deleteEvent({ id: event2.id });
    expect(secondDelete).toBe(true);

    // Try to delete first event again (should return false)
    const duplicateDelete = await deleteEvent({ id: event1.id });
    expect(duplicateDelete).toBe(false);

    // Verify no events remain
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(0);
  });
});
