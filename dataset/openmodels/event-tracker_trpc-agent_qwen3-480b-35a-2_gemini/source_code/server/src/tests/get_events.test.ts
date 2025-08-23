import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { getEvents } from '../handlers/get_events';

describe('getEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no events exist', async () => {
    const result = await getEvents();
    expect(result).toEqual([]);
  });

  it('should return all events ordered by date', async () => {
    // Insert test events
    const testEvents = [
      {
        title: 'Event 1',
        date: '2023-01-01',
        description: 'First event'
      },
      {
        title: 'Event 2',
        date: '2023-01-02',
        description: 'Second event'
      },
      {
        title: 'Event 3',
        date: '2022-12-31',
        description: null
      }
    ];

    // Insert events into database
    for (const event of testEvents) {
      await db.insert(eventsTable).values(event).execute();
    }

    const result = await getEvents();

    // Should return 3 events
    expect(result).toHaveLength(3);

    // Should be ordered by date (ascending)
    expect(result[0].title).toEqual('Event 3');
    expect(result[1].title).toEqual('Event 1');
    expect(result[2].title).toEqual('Event 2');

    // Check that date fields are properly converted to Date objects
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify data integrity
    expect(result[0].description).toBeNull();
    expect(result[1].description).toEqual('First event');
  });

  it('should handle events with null descriptions correctly', async () => {
    // Insert event with null description
    await db.insert(eventsTable).values({
      title: 'Null Description Event',
      date: '2023-06-15',
      description: null
    }).execute();

    const result = await getEvents();
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Null Description Event');
    expect(result[0].description).toBeNull();
    expect(result[0].date).toBeInstanceOf(Date);
  });
});
