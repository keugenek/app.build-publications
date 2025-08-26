import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Test input with proper date
const testInput: CreateEventInput = {
  title: 'Test Event',
  description: 'A test event for validation',
  date: new Date('2024-12-25')
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Event');
    expect(result.description).toEqual(testInput.description);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-12-25');
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
    expect(events[0].description).toEqual(testInput.description);
    expect(events[0].date).toEqual('2024-12-25'); // Date column stores as string
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different date formats correctly', async () => {
    const dateInput: CreateEventInput = {
      title: 'Date Format Test',
      description: 'Testing date conversion',
      date: new Date('2024-01-01T15:30:00Z') // Date with time
    };

    const result = await createEvent(dateInput);

    // Should only store the date part, ignoring time
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-01-01');

    // Verify in database
    const events = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(events[0].date).toEqual('2024-01-01');
  });

  it('should create multiple events with unique IDs', async () => {
    const input1: CreateEventInput = {
      title: 'First Event',
      description: 'First test event',
      date: new Date('2024-01-01')
    };

    const input2: CreateEventInput = {
      title: 'Second Event',
      description: 'Second test event',
      date: new Date('2024-01-02')
    };

    const result1 = await createEvent(input1);
    const result2 = await createEvent(input2);

    // Should have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Event');
    expect(result2.title).toEqual('Second Event');

    // Verify both exist in database
    const allEvents = await db.select()
      .from(eventsTable)
      .execute();

    expect(allEvents).toHaveLength(2);
  });

  it('should handle past and future dates', async () => {
    const pastEvent: CreateEventInput = {
      title: 'Past Event',
      description: 'An event from the past',
      date: new Date('2020-01-01')
    };

    const futureEvent: CreateEventInput = {
      title: 'Future Event',
      description: 'An event in the future',
      date: new Date('2030-01-01')
    };

    const pastResult = await createEvent(pastEvent);
    const futureResult = await createEvent(futureEvent);

    expect(pastResult.date.getFullYear()).toEqual(2020);
    expect(futureResult.date.getFullYear()).toEqual(2030);

    // Verify both dates are stored correctly
    const events = await db.select()
      .from(eventsTable)
      .execute();

    const storedDates = events.map(e => e.date).sort();
    expect(storedDates).toEqual(['2020-01-01', '2030-01-01']);
  });
});
