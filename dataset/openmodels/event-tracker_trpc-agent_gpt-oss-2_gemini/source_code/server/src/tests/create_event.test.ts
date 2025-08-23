import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Sample input for creating an event
const testInput: CreateEventInput = {
  title: 'Test Event',
  description: 'A description for testing',
  event_date: new Date('2025-01-01T10:00:00Z'),
};

describe('createEvent handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert and return a new event', async () => {
    const result = await createEvent(testInput);
    // Verify returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe(testInput.title);
    expect(result.description).toBe(testInput.description);
    expect(result.event_date instanceof Date).toBe(true);
    expect(result.event_date.getTime()).toBe(testInput.event_date.getTime());
    expect(result.created_at instanceof Date).toBe(true);
  });

  it('should persist the event in the database', async () => {
    const result = await createEvent(testInput);
    const rows = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.title).toBe(testInput.title);
    expect(row.description).toBe(testInput.description);
    expect(row.event_date.getTime()).toBe(testInput.event_date.getTime());
    expect(row.created_at instanceof Date).toBe(true);
  });
});
