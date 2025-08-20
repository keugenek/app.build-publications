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

  it('should return all events with proper date conversion', async () => {
    // Create test events with different dates
    await db.insert(eventsTable)
      .values([
        {
          title: 'Test Event 1',
          description: 'First test event',
          date: '2024-01-15'
        },
        {
          title: 'Test Event 2', 
          description: 'Second test event',
          date: '2024-02-20'
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    
    // Verify first event
    expect(result[0].title).toEqual('Test Event 1');
    expect(result[0].description).toEqual('First test event');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date.getFullYear()).toEqual(2024);
    expect(result[0].date.getMonth()).toEqual(0); // January is 0
    expect(result[0].date.getDate()).toEqual(15);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    // Verify second event
    expect(result[1].title).toEqual('Test Event 2');
    expect(result[1].description).toEqual('Second test event');
    expect(result[1].date).toBeInstanceOf(Date);
    expect(result[1].date.getFullYear()).toEqual(2024);
    expect(result[1].date.getMonth()).toEqual(1); // February is 1
    expect(result[1].date.getDate()).toEqual(20);
  });

  it('should return events ordered by date ascending', async () => {
    // Insert events in reverse chronological order
    await db.insert(eventsTable)
      .values([
        {
          title: 'Later Event',
          description: 'This happens later',
          date: '2024-12-25'
        },
        {
          title: 'Earlier Event',
          description: 'This happens first',
          date: '2024-01-01'
        },
        {
          title: 'Middle Event',
          description: 'This happens in between',
          date: '2024-06-15'
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(3);
    
    // Verify correct ordering by date (ascending)
    expect(result[0].title).toEqual('Earlier Event');
    expect(result[0].date.getMonth()).toEqual(0); // January
    
    expect(result[1].title).toEqual('Middle Event');
    expect(result[1].date.getMonth()).toEqual(5); // June
    
    expect(result[2].title).toEqual('Later Event');
    expect(result[2].date.getMonth()).toEqual(11); // December
    
    // Verify dates are in ascending order
    expect(result[0].date.getTime()).toBeLessThan(result[1].date.getTime());
    expect(result[1].date.getTime()).toBeLessThan(result[2].date.getTime());
  });

  it('should handle events with same date correctly', async () => {
    const sameDate = '2024-05-10';
    
    await db.insert(eventsTable)
      .values([
        {
          title: 'Event A',
          description: 'First event on same date',
          date: sameDate
        },
        {
          title: 'Event B',
          description: 'Second event on same date',
          date: sameDate
        }
      ])
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(2);
    
    // Both events should have the same date
    expect(result[0].date.getTime()).toEqual(result[1].date.getTime());
    expect(result[0].date.getMonth()).toEqual(4); // May is 4
    expect(result[0].date.getDate()).toEqual(10);
    expect(result[1].date.getMonth()).toEqual(4);
    expect(result[1].date.getDate()).toEqual(10);
  });

  it('should return events with all required fields', async () => {
    await db.insert(eventsTable)
      .values({
        title: 'Complete Event',
        description: 'Event with all fields',
        date: '2024-03-15'
      })
      .execute();

    const result = await getEvents();

    expect(result).toHaveLength(1);
    
    const event = result[0];
    expect(event.id).toBeDefined();
    expect(typeof event.id).toEqual('number');
    expect(event.title).toEqual('Complete Event');
    expect(typeof event.title).toEqual('string');
    expect(event.description).toEqual('Event with all fields');
    expect(typeof event.description).toEqual('string');
    expect(event.date).toBeInstanceOf(Date);
    expect(event.created_at).toBeInstanceOf(Date);
  });
});
