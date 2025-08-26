import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateEventInput = {
  title: 'Test Event',
  date: new Date('2023-12-25'),
  description: 'A test event for testing purposes'
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Event');
    expect(result.date).toEqual(testInput.date);
    expect(result.description).toEqual(testInput.description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save event to database', async () => {
    const result = await createEvent(testInput);

    // Query using proper drizzle syntax
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Test Event');
    // Database stores date as string, so we need to convert for comparison
    expect(new Date(events[0].date)).toEqual(testInput.date);
    expect(events[0].description).toEqual(testInput.description);
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle event with null description', async () => {
    const inputWithNullDescription: CreateEventInput = {
      title: 'Event with null description',
      date: new Date('2023-12-26'),
      description: null
    };

    const result = await createEvent(inputWithNullDescription);

    expect(result.title).toEqual('Event with null description');
    expect(result.description).toBeNull();
    expect(result.date).toEqual(inputWithNullDescription.date);

    // Verify in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].description).toBeNull();
    // Database stores date as string, so we need to convert for comparison
    expect(new Date(events[0].date)).toEqual(inputWithNullDescription.date);
  });
});
