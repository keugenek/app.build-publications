import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type GetEventInput } from '../schema';
import { getEvent } from '../handlers/get_event';

describe('getEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an event when found by ID', async () => {
    // Create a test event first
    const testEvent = {
      title: 'Test Event',
      description: 'A test event description',
      date: new Date('2024-01-15T10:00:00Z')
    };

    const insertResult = await db.insert(eventsTable)
      .values(testEvent)
      .returning()
      .execute();

    const createdEvent = insertResult[0];
    
    // Test the handler
    const input: GetEventInput = { id: createdEvent.id };
    const result = await getEvent(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEvent.id);
    expect(result!.title).toEqual('Test Event');
    expect(result!.description).toEqual('A test event description');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.date.toISOString()).toEqual('2024-01-15T10:00:00.000Z');
  });

  it('should return null when event is not found', async () => {
    const input: GetEventInput = { id: 999 };
    const result = await getEvent(input);

    expect(result).toBeNull();
  });

  it('should handle event with null description', async () => {
    // Create event with null description
    const testEvent = {
      title: 'Event Without Description',
      description: null,
      date: new Date('2024-02-20T14:30:00Z')
    };

    const insertResult = await db.insert(eventsTable)
      .values(testEvent)
      .returning()
      .execute();

    const createdEvent = insertResult[0];
    
    // Test the handler
    const input: GetEventInput = { id: createdEvent.id };
    const result = await getEvent(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEvent.id);
    expect(result!.title).toEqual('Event Without Description');
    expect(result!.description).toBeNull();
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return correct event among multiple events', async () => {
    // Create multiple test events
    const events = [
      {
        title: 'First Event',
        description: 'First description',
        date: new Date('2024-01-01T09:00:00Z')
      },
      {
        title: 'Second Event',
        description: 'Second description',
        date: new Date('2024-01-02T10:00:00Z')
      },
      {
        title: 'Third Event',
        description: null,
        date: new Date('2024-01-03T11:00:00Z')
      }
    ];

    // Insert all events
    const insertResults = await db.insert(eventsTable)
      .values(events)
      .returning()
      .execute();

    // Get the second event
    const targetEvent = insertResults[1];
    const input: GetEventInput = { id: targetEvent.id };
    const result = await getEvent(input);

    // Verify we got the correct event
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetEvent.id);
    expect(result!.title).toEqual('Second Event');
    expect(result!.description).toEqual('Second description');
    expect(result!.date.toISOString()).toEqual('2024-01-02T10:00:00.000Z');
  });

  it('should handle date objects correctly', async () => {
    // Create event with specific date
    const eventDate = new Date('2024-12-25T00:00:00Z');
    const testEvent = {
      title: 'Christmas Event',
      description: 'Holiday celebration',
      date: eventDate
    };

    const insertResult = await db.insert(eventsTable)
      .values(testEvent)
      .returning()
      .execute();

    const createdEvent = insertResult[0];
    
    // Test the handler
    const input: GetEventInput = { id: createdEvent.id };
    const result = await getEvent(input);

    // Verify date handling
    expect(result).not.toBeNull();
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.date.getTime()).toEqual(eventDate.getTime());
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBeGreaterThan(0);
  });
});
