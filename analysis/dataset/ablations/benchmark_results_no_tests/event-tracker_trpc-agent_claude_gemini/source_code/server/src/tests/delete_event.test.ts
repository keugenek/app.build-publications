import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput, type CreateEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Helper function to create a test event
const createTestEvent = async (eventData: Partial<CreateEventInput> = {}) => {
  const defaultData: CreateEventInput = {
    title: 'Test Event',
    date: new Date('2024-12-25'),
    description: 'A test event for deletion testing'
  };

  const testEvent = { ...defaultData, ...eventData };

  const result = await db.insert(eventsTable)
    .values({
      title: testEvent.title,
      date: testEvent.date.toISOString().split('T')[0], // Convert Date to date string
      description: testEvent.description
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event successfully', async () => {
    // Create a test event first
    const createdEvent = await createTestEvent();
    
    const deleteInput: DeleteEventInput = {
      id: createdEvent.id
    };

    const result = await deleteEvent(deleteInput);

    // Should return success true
    expect(result.success).toBe(true);

    // Verify event was actually deleted from database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, createdEvent.id))
      .execute();

    expect(events).toHaveLength(0);
  });

  it('should return success false for non-existent event', async () => {
    const nonExistentId = 999999;
    
    const deleteInput: DeleteEventInput = {
      id: nonExistentId
    };

    const result = await deleteEvent(deleteInput);

    // Should return success false when no event was found to delete
    expect(result.success).toBe(false);
  });

  it('should only delete the specified event', async () => {
    // Create multiple test events
    const event1 = await createTestEvent({ title: 'Event 1' });
    const event2 = await createTestEvent({ title: 'Event 2' });
    const event3 = await createTestEvent({ title: 'Event 3' });

    const deleteInput: DeleteEventInput = {
      id: event2.id
    };

    const result = await deleteEvent(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the targeted event was deleted
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(2);
    expect(remainingEvents.map(e => e.id)).toEqual(
      expect.arrayContaining([event1.id, event3.id])
    );
    expect(remainingEvents.map(e => e.id)).not.toContain(event2.id);
  });

  it('should handle deletion of events with different dates', async () => {
    // Create events with different dates
    const pastEvent = await createTestEvent({ 
      title: 'Past Event',
      date: new Date('2023-01-01')
    });
    
    const futureEvent = await createTestEvent({ 
      title: 'Future Event',
      date: new Date('2025-12-31')
    });

    // Delete the past event
    const deleteInput: DeleteEventInput = {
      id: pastEvent.id
    };

    const result = await deleteEvent(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the future event remains
    const remainingEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(remainingEvents).toHaveLength(1);
    expect(remainingEvents[0].id).toBe(futureEvent.id);
    expect(remainingEvents[0].title).toBe('Future Event');
  });

  it('should validate input contains required id field', async () => {
    // Create a test event first
    const createdEvent = await createTestEvent();

    // Test with valid input
    const validInput: DeleteEventInput = {
      id: createdEvent.id
    };

    const result = await deleteEvent(validInput);
    expect(result.success).toBe(true);

    // Note: Invalid input validation is handled by Zod schema validation
    // at the API layer, not in the handler itself
  });
});
