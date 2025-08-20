import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateEventInput = {
  title: 'Team Meeting',
  description: 'Weekly team sync meeting',
  date: new Date('2024-03-15')
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Team Meeting');
    expect(result.description).toEqual(testInput.description);
    expect(result.date).toEqual(new Date('2024-03-15'));
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
    expect(events[0].title).toEqual('Team Meeting');
    expect(events[0].description).toEqual(testInput.description);
    expect(events[0].date).toEqual('2024-03-15'); // Database stores as string
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription: CreateEventInput = {
      title: 'Event without description',
      description: null,
      date: new Date('2024-04-20')
    };

    const result = await createEvent(inputWithNullDescription);

    expect(result.title).toEqual('Event without description');
    expect(result.description).toBeNull();
    expect(result.date).toEqual(new Date('2024-04-20'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save null description to database correctly', async () => {
    const inputWithNullDescription: CreateEventInput = {
      title: 'Null Description Event',
      description: null,
      date: new Date('2024-05-10')
    };

    const result = await createEvent(inputWithNullDescription);

    // Verify in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Null Description Event');
    expect(events[0].description).toBeNull();
    expect(events[0].date).toEqual('2024-05-10');
  });

  it('should handle different date formats correctly', async () => {
    const futureDate = new Date('2024-12-25');
    const inputWithFutureDate: CreateEventInput = {
      title: 'Christmas Event',
      description: 'Holiday celebration',
      date: futureDate
    };

    const result = await createEvent(inputWithFutureDate);

    expect(result.title).toEqual('Christmas Event');
    expect(result.date).toEqual(futureDate);
    expect(result.date).toBeInstanceOf(Date);

    // Verify the date conversion in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events[0].date).toEqual('2024-12-25'); // Stored as ISO date string
  });
});
