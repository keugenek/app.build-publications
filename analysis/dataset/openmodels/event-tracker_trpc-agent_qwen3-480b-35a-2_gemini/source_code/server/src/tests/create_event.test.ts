import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Test input with all required fields
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
    expect(result.date).toEqual(new Date('2023-12-25'));
    expect(result.description).toEqual('A test event for testing purposes');
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
    // Database returns date as string, so convert it back to Date for comparison
    expect(new Date(events[0].date)).toEqual(new Date('2023-12-25'));
    expect(events[0].description).toEqual('A test event for testing purposes');
    expect(events[0].id).toBeDefined();
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNull: CreateEventInput = {
      title: 'Event with Null Description',
      date: new Date('2023-11-10'),
      description: null
    };

    const result = await createEvent(inputWithNull);

    expect(result.title).toEqual('Event with Null Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
