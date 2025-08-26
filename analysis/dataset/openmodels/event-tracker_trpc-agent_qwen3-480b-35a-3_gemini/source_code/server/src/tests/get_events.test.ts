import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable } from '../db/schema';
import { getEvents } from '../handlers/get_events';

describe('getEvents', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(eventsTable).values([
      {
        title: 'Event 1',
        date: '2023-06-15',
        description: 'First test event',
      },
      {
        title: 'Event 2',
        date: '2023-06-20',
        description: 'Second test event',
      },
      {
        title: 'Event 3',
        date: '2023-06-10',
        description: null,
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all events from the database', async () => {
    const events = await getEvents();

    expect(events).toHaveLength(3);
    
    // Check that all required fields are present
    events.forEach(event => {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('created_at');
      expect(event.title).toEqual(expect.any(String));
      expect(event.date).toBeInstanceOf(Date);
      expect(event.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return events sorted by date', async () => {
    const events = await getEvents();

    // Events should be sorted by date (ascending)
    expect(events[0].title).toBe('Event 3'); // 2023-06-10
    expect(events[1].title).toBe('Event 1'); // 2023-06-15
    expect(events[2].title).toBe('Event 2'); // 2023-06-20
  });

  it('should correctly handle nullable descriptions', async () => {
    const events = await getEvents();

    const eventWithDescription = events.find(e => e.title === 'Event 1');
    const eventWithoutDescription = events.find(e => e.title === 'Event 3');

    expect(eventWithDescription).toBeDefined();
    expect(eventWithDescription?.description).toBe('First test event');

    expect(eventWithoutDescription).toBeDefined();
    expect(eventWithoutDescription?.description).toBeNull();
  });

  it('should return an empty array when no events exist', async () => {
    // Clear the database
    await db.delete(eventsTable).execute();
    
    const events = await getEvents();
    expect(events).toHaveLength(0);
  });
});
