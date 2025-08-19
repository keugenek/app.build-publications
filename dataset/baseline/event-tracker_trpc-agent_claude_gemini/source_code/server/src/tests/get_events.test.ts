import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { type CreateEventInput } from '../schema';
import { getEvents } from '../handlers/get_events';

describe('getEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no events exist', async () => {
    const result = await getEvents();
    
    expect(result).toEqual([]);
  });

  it('should return all events ordered by date ascending', async () => {
    // Create test events with different dates
    const testEvents = [
      {
        title: 'Future Event',
        description: 'Event happening in the future',
        date: new Date('2024-12-31T10:00:00Z')
      },
      {
        title: 'Past Event',
        description: 'Event that already happened',
        date: new Date('2024-01-01T09:00:00Z')
      },
      {
        title: 'Current Event',
        description: 'Event happening now',
        date: new Date('2024-06-15T12:00:00Z')
      }
    ];

    // Insert test events
    await db.insert(eventsTable)
      .values(testEvents)
      .execute();

    const result = await getEvents();

    // Should return 3 events
    expect(result).toHaveLength(3);

    // Should be ordered by date ascending (chronological order)
    expect(result[0].title).toEqual('Past Event');
    expect(result[1].title).toEqual('Current Event');
    expect(result[2].title).toEqual('Future Event');

    // Verify date ordering
    expect(result[0].date).toEqual(new Date('2024-01-01T09:00:00Z'));
    expect(result[1].date).toEqual(new Date('2024-06-15T12:00:00Z'));
    expect(result[2].date).toEqual(new Date('2024-12-31T10:00:00Z'));
  });

  it('should handle events with null descriptions', async () => {
    // Create event with null description
    await db.insert(eventsTable)
      .values({
        title: 'Event Without Description',
        description: null,
        date: new Date('2024-05-01T14:00:00Z')
      })
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Event Without Description');
    expect(result[0].description).toBeNull();
    expect(result[0].date).toEqual(new Date('2024-05-01T14:00:00Z'));
  });

  it('should return all event fields correctly', async () => {
    const testEvent = {
      title: 'Complete Event',
      description: 'Event with all fields',
      date: new Date('2024-07-01T15:30:00Z')
    };

    await db.insert(eventsTable)
      .values(testEvent)
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(1);
    
    const event = result[0];
    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe('number');
    expect(event.title).toEqual('Complete Event');
    expect(event.description).toEqual('Event with all fields');
    expect(event.date).toEqual(new Date('2024-07-01T15:30:00Z'));
    expect(event.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple events with same date correctly', async () => {
    const sameDate = new Date('2024-08-15T10:00:00Z');
    
    const testEvents = [
      {
        title: 'First Event',
        description: 'First event at same time',
        date: sameDate
      },
      {
        title: 'Second Event',
        description: 'Second event at same time',
        date: sameDate
      }
    ];

    await db.insert(eventsTable)
      .values(testEvents)
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    
    // Both events should have the same date
    expect(result[0].date).toEqual(sameDate);
    expect(result[1].date).toEqual(sameDate);
    
    // Should contain both event titles
    const titles = result.map(event => event.title);
    expect(titles).toContain('First Event');
    expect(titles).toContain('Second Event');
  });

  it('should handle large number of events efficiently', async () => {
    // Create 25 test events with incrementing dates (avoiding invalid dates like Jan 31+)
    const testEvents = Array.from({ length: 25 }, (_, index) => ({
      title: `Event ${index + 1}`,
      description: `Description for event ${index + 1}`,
      date: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T12:00:00Z`)
    }));

    await db.insert(eventsTable)
      .values(testEvents)
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(25);
    
    // Verify chronological ordering
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
    
    // Verify first and last events
    expect(result[0].title).toEqual('Event 1');
    expect(result[24].title).toEqual('Event 25');
  });
});
