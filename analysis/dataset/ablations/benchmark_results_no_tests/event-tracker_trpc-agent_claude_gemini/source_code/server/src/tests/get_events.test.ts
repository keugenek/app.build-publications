import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { getEvents } from '../handlers/get_events';

describe('getEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no events exist', async () => {
    const result = await getEvents();

    expect(result).toEqual([]);
  });

  it('should return all events', async () => {
    // Create test events
    await db.insert(eventsTable)
      .values([
        {
          title: 'Event 1',
          date: '2024-01-15',
          description: 'First test event'
        },
        {
          title: 'Event 2',
          date: '2024-02-20',
          description: 'Second test event'
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Event 1');
    expect(result[0].description).toEqual('First test event');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].title).toEqual('Event 2');
    expect(result[1].description).toEqual('Second test event');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return events ordered by date ascending', async () => {
    // Create events with different dates in non-chronological order
    await db.insert(eventsTable)
      .values([
        {
          title: 'Future Event',
          date: '2024-12-25',
          description: 'Christmas event'
        },
        {
          title: 'Past Event',
          date: '2024-01-01',
          description: 'New Year event'
        },
        {
          title: 'Middle Event',
          date: '2024-06-15',
          description: 'Summer event'
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(3);
    
    // Verify ordering by date (ascending)
    expect(result[0].title).toEqual('Past Event');
    expect(result[0].date).toEqual(new Date('2024-01-01'));
    
    expect(result[1].title).toEqual('Middle Event');
    expect(result[1].date).toEqual(new Date('2024-06-15'));
    
    expect(result[2].title).toEqual('Future Event');
    expect(result[2].date).toEqual(new Date('2024-12-25'));

    // Verify dates are in ascending order
    const dates = result.map(event => event.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i - 1].getTime());
    }
  });

  it('should handle events with same date correctly', async () => {
    // Create multiple events on the same date
    await db.insert(eventsTable)
      .values([
        {
          title: 'Morning Event',
          date: '2024-05-10',
          description: 'Morning activity'
        },
        {
          title: 'Evening Event',
          date: '2024-05-10',
          description: 'Evening activity'
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    
    // Both events should have the same date
    expect(result[0].date).toEqual(new Date('2024-05-10'));
    expect(result[1].date).toEqual(new Date('2024-05-10'));
    
    // Both events should be present
    const titles = result.map(event => event.title);
    expect(titles).toContain('Morning Event');
    expect(titles).toContain('Evening Event');
  });

  it('should return events with all required fields', async () => {
    // Create a test event
    await db.insert(eventsTable)
      .values({
        title: 'Complete Event',
        date: '2024-03-15',
        description: 'Event with all fields'
      })
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(1);
    const event = result[0];
    
    // Verify all required fields are present and have correct types
    expect(typeof event.id).toBe('number');
    expect(typeof event.title).toBe('string');
    expect(event.date).toBeInstanceOf(Date);
    expect(typeof event.description).toBe('string');
    expect(event.created_at).toBeInstanceOf(Date);
    
    // Verify values
    expect(event.title).toEqual('Complete Event');
    expect(event.date).toEqual(new Date('2024-03-15'));
    expect(event.description).toEqual('Event with all fields');
  });
});
