import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteEvent } from '../handlers/delete_event';
import { type Event } from '../schema';

// Helper to create an event directly via DB for test setup
const createTestEvent = async (overrides?: Partial<Event>): Promise<Event> => {
  const result = await db
    .insert(eventsTable)
    .values({
      title: 'Test Event',
      description: 'A test event description',
      event_date: new Date(),
      // created_at will be set by DB default
      ...overrides,
    })
    .returning()
    .execute();
  return result[0] as Event;
};

describe('deleteEvent handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event and return its data', async () => {
    const event = await createTestEvent();
    const deleted = await deleteEvent({ id: event.id });

    // Verify returned data matches the original event
    expect(deleted.id).toBe(event.id);
    expect(deleted.title).toBe(event.title);
    expect(deleted.description).toBe(event.description);
    expect(deleted.event_date.getTime()).toBe(event.event_date.getTime());
    // created_at may differ slightly due to DB default, but should be a Date instance
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure the event no longer exists in the database
    const remaining = await db.select().from(eventsTable).where(eq(eventsTable.id, event.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent event', async () => {
    await expect(deleteEvent({ id: 9999 })).rejects.toThrow(/not found/i);
  });
});
