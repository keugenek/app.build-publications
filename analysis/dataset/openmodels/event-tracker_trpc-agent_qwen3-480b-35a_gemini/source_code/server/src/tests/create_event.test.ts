import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateEventInput = {
  title: 'Team Meeting',
  date: '2023-12-25T10:00:00.000Z',
  description: 'Weekly team sync'
};

const testInputWithoutDescription: CreateEventInput = {
  title: 'Lunch Break',
  date: '2023-12-26T12:00:00.000Z',
  description: null
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event with description', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Team Meeting');
    expect(result.description).toEqual('Weekly team sync');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
    expect(typeof result.date).toBe('string');
    expect(typeof result.created_at).toBe('string');
  });

  it('should create an event without description', async () => {
    const result = await createEvent(testInputWithoutDescription);

    // Basic field validation
    expect(result.title).toEqual('Lunch Break');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
  });

  it('should save event to database', async () => {
    const result = await createEvent(testInput);

    // Query using proper drizzle syntax
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Team Meeting');
    expect(events[0].description).toEqual('Weekly team sync');
    expect(events[0].date).toBeInstanceOf(Date);
    expect(events[0].created_at).toBeInstanceOf(Date);
  });
});
