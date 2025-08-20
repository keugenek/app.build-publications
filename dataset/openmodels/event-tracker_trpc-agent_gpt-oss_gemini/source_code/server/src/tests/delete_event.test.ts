import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteEvent } from '../handlers/delete_event';
import { type DeleteEventInput } from '../schema';

// Helper to create an event directly in DB
const createTestEvent = async () => {
  const result = await db
    .insert(eventsTable)
    .values({
      title: 'Test Event',
      date: '2025-01-01', // date column will coerce to string
      description: null
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteEvent handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event and return the deleted record', async () => {
    const created = await createTestEvent();
    const input: DeleteEventInput = { id: created.id };

    const deleted = await deleteEvent(input);

    // Verify returned fields
    expect(deleted.id).toBe(created.id);
    expect(deleted.title).toBe(created.title);
    expect(deleted.description).toBe(created.description);
    expect(deleted.date).toBeInstanceOf(Date);
    // Date values should be equal (ignoring ms differences)
    expect(deleted.date.getTime()).toBe(new Date(created.date as unknown as string).getTime());

    // Verify the event no longer exists in the DB
    const remaining = await db.select().from(eventsTable).where(eq(eventsTable.id, created.id)).execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent event', async () => {
    const input: DeleteEventInput = { id: 9999 };
    await expect(deleteEvent(input)).rejects.toThrow(/not found/i);
  });
});
