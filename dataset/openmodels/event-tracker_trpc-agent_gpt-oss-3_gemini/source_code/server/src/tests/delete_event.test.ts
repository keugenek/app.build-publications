import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type DeleteEventInput } from '../schema';
import { deleteEvent } from '../handlers/delete_event';
import { eq } from 'drizzle-orm';

// Helper to insert a test event directly into the DB
async function insertTestEvent() {
  const result = await db
    .insert(eventsTable)
    .values({
      title: 'Test Event',
      description: 'Event for delete test',
      date: '2025-01-01', // DATE column, time part ignored
    })
    .returning()
    .execute();
  return result[0];
}

describe('deleteEvent handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing event and return success:true', async () => {
    const event = await insertTestEvent();
    const input: DeleteEventInput = { id: event.id };
    const result = await deleteEvent(input);
    expect(result.success).toBe(true);

    // Verify the row is gone
    const remaining = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, event.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should return success:false when trying to delete a non‑existent event', async () => {
    const input: DeleteEventInput = { id: 999999 };
    const result = await deleteEvent(input);
    expect(result.success).toBe(false);
  });
});
