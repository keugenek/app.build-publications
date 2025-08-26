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
    expect(result).toHaveLength(0);
  });

  it('should return all events when events exist', async () => {
    // Create test events
    await db.insert(eventsTable).values([
      {
        title: 'Event 1',
        description: 'First event description',
        date: '2024-01-15'
      },
      {
        title: 'Event 2',
        description: null, // Test nullable field
        date: '2024-01-20'
      },
      {
        title: 'Event 3',
        description: 'Third event description',
        date: '2024-01-10'
      }
    ]).execute();

    const result = await getEvents();

    // Should return all 3 events
    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(event => {
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.date).toBeDefined();
      expect(event.created_at).toBeInstanceOf(Date);
      // description can be null, so just check it exists as a property
      expect(event).toHaveProperty('description');
    });

    // Verify specific events
    const titles = result.map(e => e.title);
    expect(titles).toContain('Event 1');
    expect(titles).toContain('Event 2');
    expect(titles).toContain('Event 3');
  });

  it('should return events ordered by date (newest first)', async () => {
    // Create events with different dates
    await db.insert(eventsTable).values([
      {
        title: 'Oldest Event',
        description: 'This should be last',
        date: '2024-01-01'
      },
      {
        title: 'Newest Event',
        description: 'This should be first',
        date: '2024-01-31'
      },
      {
        title: 'Middle Event',
        description: 'This should be middle',
        date: '2024-01-15'
      }
    ]).execute();

    const result = await getEvents();

    expect(result).toHaveLength(3);
    
    // Verify ordering (newest first)
    expect(result[0].title).toEqual('Newest Event');
    expect(result[0].date).toEqual(new Date('2024-01-31'));
    
    expect(result[1].title).toEqual('Middle Event');
    expect(result[1].date).toEqual(new Date('2024-01-15'));
    
    expect(result[2].title).toEqual('Oldest Event');
    expect(result[2].date).toEqual(new Date('2024-01-01'));
  });

  it('should handle events with null descriptions correctly', async () => {
    // Create event with null description
    await db.insert(eventsTable).values({
      title: 'Event with null description',
      description: null,
      date: '2024-01-15'
    }).execute();

    const result = await getEvents();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Event with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].date).toEqual(new Date('2024-01-15'));
  });

  it('should handle events with same dates consistently', async () => {
    // Create multiple events with same date
    await db.insert(eventsTable).values([
      {
        title: 'Event A',
        description: 'Same date event A',
        date: '2024-01-15'
      },
      {
        title: 'Event B',
        description: 'Same date event B',
        date: '2024-01-15'
      }
    ]).execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    
    // Both events should have the same date
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[1].date).toEqual(new Date('2024-01-15'));
    
    // Verify both events are returned
    const titles = result.map(e => e.title);
    expect(titles).toContain('Event A');
    expect(titles).toContain('Event B');
  });
});
