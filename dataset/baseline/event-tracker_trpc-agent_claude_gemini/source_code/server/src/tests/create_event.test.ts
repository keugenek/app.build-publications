import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { createEvent } from '../handlers/create_event';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateEventInput = {
  title: 'Test Event',
  description: 'A test event for unit testing',
  date: new Date('2024-12-31T15:30:00Z')
};

describe('createEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an event with all fields', async () => {
    const result = await createEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Event');
    expect(result.description).toEqual('A test event for unit testing');
    expect(result.date).toEqual(testInput.date);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an event with null description', async () => {
    const inputWithNullDescription: CreateEventInput = {
      title: 'Event with No Description',
      description: null,
      date: new Date('2024-06-15T10:00:00Z')
    };

    const result = await createEvent(inputWithNullDescription);

    expect(result.title).toEqual('Event with No Description');
    expect(result.description).toBeNull();
    expect(result.date).toEqual(inputWithNullDescription.date);
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
    expect(events[0].description).toEqual('A test event for unit testing');
    expect(events[0].date).toEqual(testInput.date);
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle date strings correctly', async () => {
    const inputWithDateString: CreateEventInput = {
      title: 'Event with Date String',
      description: 'Testing date string handling',
      date: new Date('2024-03-15T14:30:00.000Z')
    };

    const result = await createEvent(inputWithDateString);

    expect(result.date).toEqual(inputWithDateString.date);
    expect(result.date).toBeInstanceOf(Date);
    
    // Verify it was saved correctly in database
    const savedEvent = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, result.id))
      .execute();

    expect(savedEvent[0].date).toEqual(inputWithDateString.date);
  });

  it('should generate unique IDs for multiple events', async () => {
    const input1: CreateEventInput = {
      title: 'First Event',
      description: 'First test event',
      date: new Date('2024-01-01T12:00:00Z')
    };

    const input2: CreateEventInput = {
      title: 'Second Event',
      description: 'Second test event', 
      date: new Date('2024-01-02T12:00:00Z')
    };

    const result1 = await createEvent(input1);
    const result2 = await createEvent(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(typeof result1.id).toBe('number');
    expect(typeof result2.id).toBe('number');

    // Verify both events exist in database
    const allEvents = await db.select().from(eventsTable).execute();
    expect(allEvents).toHaveLength(2);
  });

  it('should set created_at automatically', async () => {
    const beforeCreation = new Date();
    const result = await createEvent(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
