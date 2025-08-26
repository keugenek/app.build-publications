import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput, type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Helper function to create an event for testing
const createTestEvent = async (input: Omit<CreateEventInput, 'date'> & { date: Date | string }) => {
  const result = await db.insert(eventsTable)
    .values({
      title: input.title,
      date: new Date(input.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
      description: input.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event', async () => {
    // Create a test event
    const event = await createTestEvent({
      title: 'Test Event',
      date: new Date('2023-12-25'),
      description: 'A test event'
    });

    // Delete the event
    const input: DeleteEventInput = { id: event.id };
    const result = await deleteEvent(input);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify event no longer exists in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, event.id))
      .execute();
    
    expect(events).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent event', async () => {
    // Try to delete an event that doesn't exist
    const input: DeleteEventInput = { id: 99999 };
    const result = await deleteEvent(input);

    // Should return false for non-existent event
    expect(result).toBe(false);
  });
});
